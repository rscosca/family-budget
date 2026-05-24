<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExpenseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                    => $this->id,
            'amount_cents'          => $this->amount_cents,
            'description'           => $this->description,
            'occurred_on'           => $this->occurred_on?->toDateString(),
            'category_id'           => $this->category_id,
            'family_member_id'      => $this->family_member_id,
            'registered_by_user_id' => $this->registered_by_user_id,
            'recurring_expense_id'  => $this->recurring_expense_id,
            'category'              => CategoryResource::make($this->whenLoaded('category')),
            'family_member'         => FamilyMemberResource::make($this->whenLoaded('familyMember')),
            'registered_by'         => $this->whenLoaded('registeredBy', fn () => [
                'id'       => $this->registeredBy->id,
                'username' => $this->registeredBy->username,
                'name'     => $this->registeredBy->name,
            ]),
        ];
    }
}
