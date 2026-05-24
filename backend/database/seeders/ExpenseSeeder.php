<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Expense;
use App\Models\FamilyMember;
use App\Models\RecurringExpense;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class ExpenseSeeder extends Seeder
{
    public function run(): void
    {
        Expense::query()->delete();

        mt_srand(20260521);

        $categories = Category::pluck('id', 'name');
        $members    = FamilyMember::pluck('id', 'name');
        $users      = User::pluck('id', 'username');

        $today = CarbonImmutable::create(2026, 5, 21);

        $months = [
            ['year' => 2026, 'month' => 3, 'max_day' => 31, 'count' => 32],
            ['year' => 2026, 'month' => 4, 'max_day' => 30, 'count' => 38],
            ['year' => 2026, 'month' => 5, 'max_day' => 21, 'count' => 24],
        ];

        $rows = [];

        foreach ($months as $m) {
            foreach ($this->generateRecurringInstances($m, $today) as $instance) {
                $rows[] = $instance;
            }

            for ($i = 0; $i < $m['count']; $i++) {
                $rows[] = $this->generateAdHocExpense($m, $categories, $members, $users);
            }
        }

        foreach (array_chunk($rows, 100) as $chunk) {
            Expense::insert(array_map(fn ($r) => $r + ['created_at' => Carbon::now(), 'updated_at' => Carbon::now()], $chunk));
        }

        $this->command->info(sprintf('  ExpenseSeeder: %d gastos creados.', count($rows)));
    }

    /**
     * Genera las instancias mensuales/anuales de los gastos recurrentes activos
     * para un mes concreto, sin pasar de la fecha actual simulada.
     */
    private function generateRecurringInstances(array $m, CarbonImmutable $today): array
    {
        $rows = [];

        $recurrings = RecurringExpense::where('is_active', true)->get();

        foreach ($recurrings as $recurring) {
            $day = null;

            if ($recurring->frequency === 'monthly') {
                $day = $recurring->day_of_month;
            }

            if ($recurring->frequency === 'yearly' && (int) $recurring->month_of_year === $m['month']) {
                $day = $recurring->day_of_month;
            }

            if ($day === null) {
                continue;
            }

            $day = min($day, $m['max_day']);

            $occurredOn = CarbonImmutable::create($m['year'], $m['month'], $day);
            if ($occurredOn->greaterThan($today)) {
                continue;
            }

            $rows[] = [
                'amount_cents'           => $recurring->amount_cents,
                'category_id'            => $recurring->category_id,
                'family_member_id'       => $recurring->family_member_id,
                'registered_by_user_id'  => $recurring->created_by_user_id,
                'description'            => $recurring->description,
                'occurred_on'            => $occurredOn->toDateString(),
                'recurring_expense_id'   => $recurring->id,
            ];
        }

        return $rows;
    }

    private function generateAdHocExpense(array $m, $categories, $members, $users): array
    {
        $template = $this->pickWeighted($this->templates());

        $day = mt_rand(1, $m['max_day']);
        $amount = mt_rand($template['min'], $template['max']);

        $memberName = $template['member'] ?? $this->randomMember();
        $username   = mt_rand(0, 1) === 0 ? 'papa' : 'mama';

        return [
            'amount_cents'          => $amount,
            'category_id'           => $categories[$template['category']],
            'family_member_id'      => $members[$memberName],
            'registered_by_user_id' => $users[$username],
            'description'           => $template['desc'],
            'occurred_on'           => sprintf('%04d-%02d-%02d', $m['year'], $m['month'], $day),
            'recurring_expense_id'  => null,
        ];
    }

    private function randomMember(): string
    {
        $pool = ['Papá', 'Mamá', 'Claudia', 'Pablo', 'Familia'];
        return $pool[mt_rand(0, count($pool) - 1)];
    }

    private function pickWeighted(array $templates): array
    {
        $total = array_sum(array_column($templates, 'weight'));
        $pick  = mt_rand(1, $total);
        $acc   = 0;
        foreach ($templates as $t) {
            $acc += $t['weight'];
            if ($pick <= $acc) {
                return $t;
            }
        }
        return $templates[0];
    }

    /**
     * Plantillas de gasto puntual. weight = probabilidad relativa.
     * Si la plantilla fija un `member`, ese gasto siempre se atribuye a él.
     */
    private function templates(): array
    {
        return [
            // Comida (mucho peso, es lo que más se gasta a diario)
            ['category' => 'Comida',  'desc' => 'Mercadona',          'min' => 4000, 'max' => 12000, 'weight' => 8, 'member' => 'Familia'],
            ['category' => 'Comida',  'desc' => 'Lidl',               'min' => 3000, 'max' => 8000,  'weight' => 4, 'member' => 'Familia'],
            ['category' => 'Comida',  'desc' => 'Carnicería',         'min' => 1500, 'max' => 3500,  'weight' => 2, 'member' => 'Familia'],
            ['category' => 'Comida',  'desc' => 'Frutería',           'min' => 800,  'max' => 2000,  'weight' => 3, 'member' => 'Familia'],
            ['category' => 'Comida',  'desc' => 'Panadería',          'min' => 200,  'max' => 600,   'weight' => 5, 'member' => 'Familia'],
            ['category' => 'Comida',  'desc' => 'Café',               'min' => 250,  'max' => 500,   'weight' => 6],
            ['category' => 'Comida',  'desc' => 'Restaurante',        'min' => 3000, 'max' => 8000,  'weight' => 2, 'member' => 'Familia'],
            ['category' => 'Comida',  'desc' => 'Pizza a domicilio',  'min' => 1800, 'max' => 3500,  'weight' => 1, 'member' => 'Familia'],

            // Casa
            ['category' => 'Casa',    'desc' => 'Ferretería',         'min' => 1500, 'max' => 5000,  'weight' => 1, 'member' => 'Familia'],
            ['category' => 'Casa',    'desc' => 'Droguería',          'min' => 1200, 'max' => 3500,  'weight' => 2, 'member' => 'Familia'],
            ['category' => 'Casa',    'desc' => 'IKEA',               'min' => 2000, 'max' => 8000,  'weight' => 1, 'member' => 'Familia'],
            ['category' => 'Casa',    'desc' => 'Pequeño electro',    'min' => 800,  'max' => 2500,  'weight' => 1, 'member' => 'Familia'],

            // Ocio
            ['category' => 'Ocio',    'desc' => 'Cine',               'min' => 1600, 'max' => 2800,  'weight' => 2, 'member' => 'Familia'],
            ['category' => 'Ocio',    'desc' => 'Libro',              'min' => 1500, 'max' => 2500,  'weight' => 1],
            ['category' => 'Ocio',    'desc' => 'Cervezas',           'min' => 1000, 'max' => 2500,  'weight' => 3],
            ['category' => 'Ocio',    'desc' => 'Cena con amigos',    'min' => 4000, 'max' => 9000,  'weight' => 1],
            ['category' => 'Ocio',    'desc' => 'Concierto',          'min' => 3000, 'max' => 7000,  'weight' => 1],
            ['category' => 'Ocio',    'desc' => 'Videojuego',         'min' => 3000, 'max' => 7000,  'weight' => 1],

            // Familia
            ['category' => 'Familia', 'desc' => 'Ropa Claudia',       'min' => 2000, 'max' => 6000,  'weight' => 2, 'member' => 'Claudia'],
            ['category' => 'Familia', 'desc' => 'Ropa Pablo',         'min' => 2000, 'max' => 6000,  'weight' => 2, 'member' => 'Pablo'],
            ['category' => 'Familia', 'desc' => 'Juguetes',           'min' => 1500, 'max' => 4500,  'weight' => 1],
            ['category' => 'Familia', 'desc' => 'Farmacia',           'min' => 800,  'max' => 3500,  'weight' => 2],
            ['category' => 'Familia', 'desc' => 'Material escolar',   'min' => 1500, 'max' => 4000,  'weight' => 1],
            ['category' => 'Familia', 'desc' => 'Regalo cumpleaños',  'min' => 2000, 'max' => 5000,  'weight' => 1],
        ];
    }
}
