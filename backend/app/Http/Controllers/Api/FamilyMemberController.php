<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\EnsuresAdmin;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFamilyMemberRequest;
use App\Http\Requests\UpdateFamilyMemberRequest;
use App\Http\Resources\FamilyMemberResource;
use App\Models\FamilyMember;
use Illuminate\Http\Request;

class FamilyMemberController extends Controller
{
    use EnsuresAdmin;

    public function index(Request $request)
    {
        $includeInactive = $request->boolean('include_inactive');
        if ($includeInactive) {
            $this->ensureAdmin($request);
        }

        $query = FamilyMember::query()
            ->orderBy('display_order')
            ->orderBy('name');

        if (! $includeInactive) {
            $query->where('is_active', true);
        }

        return FamilyMemberResource::collection($query->get());
    }

    public function store(StoreFamilyMemberRequest $request)
    {
        $data = $request->validated();
        $data['is_active'] = $data['is_active'] ?? true;
        $data['display_order'] = $data['display_order'] ?? 0;

        $member = FamilyMember::create($data);

        return FamilyMemberResource::make($member)
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateFamilyMemberRequest $request, FamilyMember $familyMember)
    {
        $familyMember->update($request->validated());

        return FamilyMemberResource::make($familyMember);
    }

    public function destroy(Request $request, FamilyMember $familyMember)
    {
        $this->ensureAdmin($request);

        $familyMember->update(['is_active' => false]);

        return response()->noContent();
    }
}
