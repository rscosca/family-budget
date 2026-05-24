<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\FamilyMemberController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/user', fn (Request $request) => $request->user());

    Route::apiResource('categories', CategoryController::class)->except(['show']);
    Route::apiResource('family-members', FamilyMemberController::class)
        ->parameters(['family-members' => 'familyMember'])
        ->except(['show']);

    Route::apiResource('expenses', ExpenseController::class);
});
