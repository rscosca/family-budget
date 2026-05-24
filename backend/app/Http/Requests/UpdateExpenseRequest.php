<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'amount_cents'     => ['sometimes', 'integer', 'min:1', 'max:99999999'],
            'category_id'      => ['sometimes', 'integer', 'exists:categories,id'],
            'family_member_id' => ['sometimes', 'integer', 'exists:family_members,id'],
            'description'      => ['sometimes', 'nullable', 'string', 'max:160'],
            'occurred_on'      => ['sometimes', 'date', 'before_or_equal:today'],
        ];
    }
}
