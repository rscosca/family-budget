<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;

trait EnsuresAdmin
{
    protected function ensureAdmin(Request $request): void
    {
        if (! $request->user() || ! $request->user()->isAdmin()) {
            throw new AuthorizationException('Solo administradores.');
        }
    }
}
