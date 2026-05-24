<?php

namespace App\Services;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;

class RecurringExpenseGenerator
{
    /**
     * Devuelve las fechas mensuales posteriores al mes de $start, hasta $endsOn (inclusive),
     * usando $dayOfMonth con clamp al último día si el mes no lo tiene.
     *
     * @return CarbonImmutable[]
     */
    public static function futureMonthlyDates(CarbonInterface $start, CarbonInterface $endsOn, int $dayOfMonth): array
    {
        $cursor = CarbonImmutable::create($start->year, $start->month, 1)->addMonthNoOverflow();
        $limit = CarbonImmutable::create($endsOn->year, $endsOn->month, $endsOn->day);

        $dates = [];
        while ($cursor->lessThanOrEqualTo($limit)) {
            $useDay = min($dayOfMonth, $cursor->daysInMonth);
            $date = $cursor->day($useDay);
            if ($date->lessThanOrEqualTo($limit)) {
                $dates[] = $date;
            }
            $cursor = $cursor->addMonthNoOverflow();
        }

        return $dates;
    }
}
