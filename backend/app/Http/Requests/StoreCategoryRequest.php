<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() === true;
    }

    public function rules(): array
    {
        return [
            'name'          => ['required', 'string', 'max:60', 'unique:categories,name'],
            'color'         => ['required', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'icon'          => ['required', 'string', 'max:40'],
            'display_order' => ['nullable', 'integer', 'min:0', 'max:999'],
            'is_active'     => ['nullable', 'boolean'],
        ];
    }
}
