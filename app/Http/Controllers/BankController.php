<?php

namespace App\Http\Controllers;

use App\Models\Bank;
use App\Models\BankUser;
use Illuminate\Http\Request;

class BankController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    public function index(Request $request)
    {
        $banks = Bank::orderBy('name')->paginate(20);
        return response()->json($banks);
    }

    public function show(Request $request, $id)
    {
        $bank = Bank::findOrFail($id);
        return response()->json($bank);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:banks,name',
        ]);

        $bank = Bank::create($data);
        return response()->json($bank, 201);
    }

    public function update(Request $request, $id)
    {
        $bank = Bank::findOrFail($id);

        $data = $request->validate([
            'name' => 'required|string|max:255|unique:banks,name,' . $bank->id,
        ]);

        $bank->update($data);
        return response()->json($bank);
    }

    public function destroy(Request $request, $id)
    {
        $bank = Bank::findOrFail($id);

        $bank->delete();

        return response()->json(['message' => 'Banco removido.']);
    }

    public function list(Request $request)
    {
        $banks = Bank::orderBy('name')->get(['id', 'name']);
        return response()->json($banks);
    }

    public function attachToUser(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'bank_id' => 'required|exists:banks,id',
        ]);

        $exists = BankUser::where('user_id', $user->id)
            ->where('bank_id', $data['bank_id'])
            ->first();

        if ($exists) {
            return response()->json([
                'already_attached' => true,
                'message' => 'Este banco já está vinculado ao usuário.',
                'bank_user' => $exists->load('bank'),
            ], 200);
        }

        $bankUser = BankUser::create([
            'user_id' => $user->id,
            'bank_id' => $data['bank_id'],
        ]);

        return response()->json($bankUser->load('bank'), 201);
    }
}
