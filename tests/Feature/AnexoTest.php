<?php

namespace Tests\Feature;

use App\Models\Anexo;
use App\Models\Transacao;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AnexoTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected User $otherUser;

    protected Transacao $transacao;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('anexos');

        $this->user = User::factory()->create();
        $this->otherUser = User::factory()->create();

        $this->transacao = Transacao::factory()->create([
            'user_id' => $this->user->id,
        ]);
    }

    public function test_user_can_upload_file(): void
    {
        $file = UploadedFile::fake()->image('comprovante.jpg', 800, 600);

        $response = $this->actingAs($this->user)
            ->postJson(route('anexos.store'), [
                'file' => $file,
                'transacao_id' => $this->transacao->id,
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'id',
                    'original_name',
                    'mime_type',
                    'extension',
                    'size',
                    'formatted_size',
                ],
            ]);

        $this->assertDatabaseHas('anexos', [
            'user_id' => $this->user->id,
            'original_name' => 'comprovante.jpg',
        ]);

        $this->assertDatabaseHas('anexo_transacao', [
            'transacao_id' => $this->transacao->id,
        ]);
    }

    public function test_user_can_upload_multiple_files(): void
    {
        $files = [
            UploadedFile::fake()->image('comprovante1.jpg'),
            UploadedFile::fake()->image('comprovante2.png'),
            UploadedFile::fake()->create('planilha.xlsx', 100),
        ];

        $response = $this->actingAs($this->user)
            ->postJson(route('anexos.store'), [
                'files' => $files,
                'transacao_id' => $this->transacao->id,
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data',
            ]);

        $this->assertDatabaseCount('anexos', 3);
    }

    public function test_user_cannot_upload_invalid_file_type(): void
    {
        $file = UploadedFile::fake()->create('malicious.exe', 100);

        $response = $this->actingAs($this->user)
            ->postJson(route('anexos.store'), [
                'file' => $file,
            ]);

        $response->assertStatus(422);
    }

    public function test_user_cannot_upload_file_exceeding_max_size(): void
    {
        // Simula arquivo maior que 10MB
        $file = UploadedFile::fake()->create('large.pdf', 11 * 1024); // 11MB

        $response = $this->actingAs($this->user)
            ->postJson(route('anexos.store'), [
                'file' => $file,
            ]);

        $response->assertStatus(422);
    }

    public function test_user_can_list_anexos_for_transacao(): void
    {
        $anexo = Anexo::factory()->create([
            'user_id' => $this->user->id,
        ]);
        $anexo->transacoes()->attach($this->transacao->id);

        $response = $this->actingAs($this->user)
            ->getJson(route('transacoes.anexos', $this->transacao->id));

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'original_name',
                        'mime_type',
                        'formatted_size',
                    ],
                ],
            ]);
    }

    public function test_user_cannot_list_anexos_from_other_users_transacao(): void
    {
        $otherTransacao = Transacao::factory()->create([
            'user_id' => $this->otherUser->id,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson(route('transacoes.anexos', $otherTransacao->id));

        $response->assertStatus(404);
    }

    public function test_user_can_download_own_anexo(): void
    {
        Storage::disk('anexos')->put('users/1/2026/01/test.jpg', 'fake content');

        $anexo = Anexo::factory()->create([
            'user_id' => $this->user->id,
            'disk' => 'anexos',
            'path' => 'users/1/2026/01',
            'stored_name' => 'test.jpg',
        ]);

        $response = $this->actingAs($this->user)
            ->get(route('anexos.download', $anexo->id));

        $response->assertStatus(200);
    }

    public function test_user_cannot_download_other_users_anexo(): void
    {
        $otherAnexo = Anexo::factory()->create([
            'user_id' => $this->otherUser->id,
        ]);

        $response = $this->actingAs($this->user)
            ->get(route('anexos.download', $otherAnexo->id));

        $response->assertStatus(404);
    }

    public function test_user_can_delete_own_anexo(): void
    {
        $anexo = Anexo::factory()->create([
            'user_id' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)
            ->deleteJson(route('anexos.destroy', $anexo->id));

        $response->assertStatus(200)
            ->assertJson(['message' => 'Anexo removido com sucesso.']);

        $this->assertSoftDeleted('anexos', ['id' => $anexo->id]);
    }

    public function test_user_cannot_delete_other_users_anexo(): void
    {
        $otherAnexo = Anexo::factory()->create([
            'user_id' => $this->otherUser->id,
        ]);

        $response = $this->actingAs($this->user)
            ->deleteJson(route('anexos.destroy', $otherAnexo->id));

        $response->assertStatus(404);
    }

    public function test_user_can_update_anexo_description(): void
    {
        $anexo = Anexo::factory()->create([
            'user_id' => $this->user->id,
            'description' => 'Descrição antiga',
        ]);

        $response = $this->actingAs($this->user)
            ->patchJson(route('anexos.update', $anexo->id), [
                'description' => 'Nova descrição do anexo',
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('anexos', [
            'id' => $anexo->id,
            'description' => 'Nova descrição do anexo',
        ]);
    }

    public function test_user_can_attach_existing_anexo_to_transacao(): void
    {
        $anexo = Anexo::factory()->create([
            'user_id' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)
            ->postJson(route('anexos.attach'), [
                'anexo_id' => $anexo->id,
                'transacao_id' => $this->transacao->id,
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('anexo_transacao', [
            'anexo_id' => $anexo->id,
            'transacao_id' => $this->transacao->id,
        ]);
    }

    public function test_user_can_detach_anexo_from_transacao(): void
    {
        $anexo = Anexo::factory()->create([
            'user_id' => $this->user->id,
        ]);
        $anexo->transacoes()->attach($this->transacao->id);

        $response = $this->actingAs($this->user)
            ->deleteJson(route('anexos.detach', [
                'anexoId' => $anexo->id,
                'transacaoId' => $this->transacao->id,
            ]));

        $response->assertStatus(200);

        $this->assertDatabaseMissing('anexo_transacao', [
            'anexo_id' => $anexo->id,
            'transacao_id' => $this->transacao->id,
        ]);
    }

    public function test_user_can_get_stats(): void
    {
        Anexo::factory()->count(3)->create([
            'user_id' => $this->user->id,
            'size' => 1024 * 1024, // 1MB each
        ]);

        $response = $this->actingAs($this->user)
            ->getJson(route('anexos.stats'));

        $response->assertStatus(200)
            ->assertJsonStructure([
                'total_files',
                'total_space_bytes',
                'total_space_formatted',
            ])
            ->assertJson([
                'total_files' => 3,
            ]);
    }

    public function test_unauthenticated_user_cannot_access_anexos(): void
    {
        $response = $this->getJson(route('anexos.index'));

        $response->assertStatus(401);
    }
}
