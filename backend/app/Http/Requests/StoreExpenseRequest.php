<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'amount_cents'              => ['required', 'integer', 'min:1', 'max:99999999'],
            'category_id'               => ['required', 'integer', 'exists:categories,id'],
            'family_member_id'          => ['required', 'integer', 'exists:family_members,id'],
            'description'               => ['nullable', 'string', 'max:160'],
            'occurred_on'               => ['required', 'date', 'before_or_equal:today'],
            'recurring'                 => ['nullable', 'array'],
            'recurring.day_of_month'    => ['required_with:recurring', 'integer', 'between:1,31'],
            'recurring.ends_on'         => ['required_with:recurring', 'date', 'after_or_equal:occurred_on'],
        ];
    }
}
