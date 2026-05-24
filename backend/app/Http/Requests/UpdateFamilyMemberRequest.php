<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFamilyMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() === true;
    }

    public function rules(): array
    {
        $id = $this->route('family_member')?->id;

        return [
            'name'          => ['sometimes', 'required', 'string', 'max:60', Rule::unique('family_members', 'name')->ignore($id)],
            'color'         => ['sometimes', 'required', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'icon'          => ['sometimes', 'required', 'string', 'max:40'],
            'display_order' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:999'],
            'is_active'     => ['sometimes', 'boolean'],
        ];
    }
}
