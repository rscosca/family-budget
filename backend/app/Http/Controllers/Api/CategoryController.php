<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\EnsuresAdmin;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    use EnsuresAdmin;

    public function index(Request $request)
    {
        $includeInactive = $request->boolean('include_inactive');
        if ($includeInactive) {
            $this->ensureAdmin($request);
        }

        $query = Category::query()
            ->orderBy('display_order')
            ->orderBy('name');

        if (! $includeInactive) {
            $query->where('is_active', true);
        }

        return CategoryResource::collection($query->get());
    }

    public function store(StoreCategoryRequest $request)
    {
        $data = $request->validated();
        $data['created_by_user_id'] = $request->user()->id;
        $data['is_active'] = $data['is_active'] ?? true;
        $data['display_order'] = $data['display_order'] ?? 0;

        $category = Category::create($data);

        return CategoryResource::make($category)
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateCategoryRequest $request, Category $category)
    {
        $category->update($request->validated());

        return CategoryResource::make($category);
    }

    public function destroy(Request $request, Category $category)
    {
        $this->ensureAdmin($request);

        $category->update(['is_active' => false]);

        return response()->noContent();
    }
}
