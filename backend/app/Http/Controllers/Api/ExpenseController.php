<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreExpenseRequest;
use App\Http\Requests\UpdateExpenseRequest;
use App\Http\Resources\ExpenseResource;
use App\Models\Expense;
use App\Models\RecurringExpense;
use App\Services\RecurringExpenseGenerator;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExpenseController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'from'             => ['nullable', 'date'],
            'to'               => ['nullable', 'date', 'after_or_equal:from'],
            'category_id'      => ['nullable', 'integer', 'exists:categories,id'],
            'family_member_id' => ['nullable', 'integer', 'exists:family_members,id'],
            'search'           => ['nullable', 'string', 'max:80'],
            'per_page'         => ['nullable', 'integer', 'min:1', 'max:200'],
        ]);

        $query = Expense::query()
            ->with(['category', 'familyMember', 'registeredBy'])
            ->orderByDesc('occurred_on')
            ->orderByDesc('id');

        if (isset($validated['from'])) {
            $query->whereDate('occurred_on', '>=', $validated['from']);
        }
        if (isset($validated['to'])) {
            $query->whereDate('occurred_on', '<=', $validated['to']);
        }
        if (isset($validated['category_id'])) {
            $query->where('category_id', $validated['category_id']);
        }
        if (isset($validated['family_member_id'])) {
            $query->where('family_member_id', $validated['family_member_id']);
        }
        if (isset($validated['search'])) {
            $query->where('description', 'like', '%'.$validated['search'].'%');
        }

        $perPage = $validated['per_page'] ?? 50;

        return ExpenseResource::collection($query->paginate($perPage)->appends($request->query()));
    }

    public function store(StoreExpenseRequest $request)
    {
        $data = $request->validated();
        $recurring = $data['recurring'] ?? null;
        unset($data['recurring']);

        $userId = $request->user()->id;

        $expense = DB::transaction(function () use ($data, $recurring, $userId) {
            $recurringId = null;

            if ($recurring) {
                $template = RecurringExpense::create([
                    'amount_cents'        => $data['amount_cents'],
                    'category_id'         => $data['category_id'],
                    'family_member_id'    => $data['family_member_id'],
                    'created_by_user_id'  => $userId,
                    'description'         => $data['description'] ?? '',
                    'frequency'           => 'monthly',
                    'day_of_month'        => $recurring['day_of_month'],
                    'starts_on'           => $data['occurred_on'],
                    'ends_on'             => $recurring['ends_on'],
                    'is_active'           => true,
                ]);
                $recurringId = $template->id;

                $futureDates = RecurringExpenseGenerator::futureMonthlyDates(
                    CarbonImmutable::parse($data['occurred_on']),
                    CarbonImmutable::parse($recurring['ends_on']),
                    (int) $recurring['day_of_month'],
                );

                foreach ($futureDates as $date) {
                    Expense::create([
                        'amount_cents'          => $data['amount_cents'],
                        'category_id'           => $data['category_id'],
                        'family_member_id'      => $data['family_member_id'],
                        'registered_by_user_id' => $userId,
                        'description'           => $data['description'] ?? null,
                        'occurred_on'           => $date->toDateString(),
                        'recurring_expense_id'  => $recurringId,
                    ]);
                }
            }

            return Expense::create($data + [
                'registered_by_user_id' => $userId,
                'recurring_expense_id'  => $recurringId,
            ]);
        });

        $expense->load(['category', 'familyMember', 'registeredBy']);

        return ExpenseResource::make($expense)
            ->response()
            ->setStatusCode(201);
    }

    public function show(Expense $expense)
    {
        $expense->load(['category', 'familyMember', 'registeredBy']);

        return ExpenseResource::make($expense);
    }

    public function update(UpdateExpenseRequest $request, Expense $expense)
    {
        $expense->update($request->validated());
        $expense->load(['category', 'familyMember', 'registeredBy']);

        return ExpenseResource::make($expense);
    }

    public function destroy(Expense $expense)
    {
        $expense->delete();

        return response()->noContent();
    }
}
