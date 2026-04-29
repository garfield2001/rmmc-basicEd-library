<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class IndexTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_page_can_be_rendered(): void
    {
        $response = $this->get('/');

        $response->assertOk();
    }
}
