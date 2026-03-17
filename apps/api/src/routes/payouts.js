import { Router } from 'express';
import { randomUUID } from 'crypto';
import pb from '../utils/pocketbaseClient.js';
import { trigger } from '../services/webhookService.js';
import logger from '../utils/logger.js';

const router = Router();

const VALID_PAYOUT_METHODS = ['bank_transfer', 'wallet', 'check', 'wire', 'paypal'];

router.post('/payouts', async (req, res) => {
	const {
		professional_id,
		amount,
		payout_method,
		description,
	} = req.body;

	const idempotencyKey = req.headers['idempotency-key'];

	// Validate required fields
	if (!professional_id || amount === undefined || !payout_method) {
		return res.status(400).json({ error: 'Missing required fields: professional_id, amount, payout_method' });
	}

	// Validate payout_method
	if (!VALID_PAYOUT_METHODS.includes(payout_method)) {
		return res.status(400).json({ error: `Invalid payout_method. Must be one of: ${VALID_PAYOUT_METHODS.join(', ')}` });
	}

	// Validate amount is positive
	if (typeof amount !== 'number' || amount <= 0) {
		return res.status(400).json({ error: 'amount must be a positive number' });
	}

	// Check idempotency key
	if (idempotencyKey) {
		try {
			const existingPayout = await pb.collection('payouts').getFirstListItem(
				`idempotency_key="${idempotencyKey}" && organization_id="${req.organizationId}"`
			);
			return res.status(201).json({
				id: existingPayout.id,
				payout_id: existingPayout.payout_id,
				organization_id: existingPayout.organization_id,
				professional_id: existingPayout.professional_id,
				amount: existingPayout.amount,
				payout_method: existingPayout.payout_method,
				status: existingPayout.status,
				description: existingPayout.description,
				payout_date: existingPayout.payout_date,
				created_at: existingPayout.created_at,
				idempotent: true,
			});
		} catch (error) {
			// Key doesn't exist, continue with creation
		}
	}

	// Verify professional exists and belongs to organization
	let professional;
	try {
		professional = await pb.collection('professionals').getOne(professional_id);
		if (professional.organization_id !== req.organizationId) {
			throw new Error('Professional does not belong to this organization');
		}
	} catch (error) {
		if (error.message.includes('does not belong')) {
			return res.status(403).json({ error: 'Professional does not belong to this organization' });
		}
		throw new Error('Professional not found');
	}

	// Get professional wallet
	let professionalWallet;
	try {
		professionalWallet = await pb.collection('professional_wallets').getFirstListItem(
			`professional_id="${professional_id}" && organization_id="${req.organizationId}"`
		);
	} catch (error) {
		throw new Error('Professional wallet not found');
	}

	// Get wallet balance
	let walletBalance;
	try {
		walletBalance = await pb.collection('wallet_balances').getFirstListItem(
			`wallet_id="${professionalWallet.wallet_id}"`
		);
	} catch (error) {
		throw new Error('Wallet balance not found');
	}

	const availableBalance = walletBalance.available_balance || 0;

	// Validate sufficient balance
	if (amount > availableBalance) {
		return res.status(409).json({
			error: 'Insufficient balance',
			available_balance: availableBalance,
			requested_amount: amount,
		});
	}

	// Create payout record
	const payoutId = randomUUID();
	const today = new Date().toISOString().split('T')[0];

	const payoutRecord = await pb.collection('payouts').create({
		payout_id: payoutId,
		organization_id: req.organizationId,
		professional_id,
		amount,
		payout_method,
		description: description || null,
		status: 'pending',
		idempotency_key: idempotencyKey || null,
		payout_date: today,
	});

	// Trigger webhook asynchronously
	setImmediate(async () => {
		try {
			await trigger('payout.completed', {
				payout_id: payoutRecord.payout_id,
				professional_id,
				amount,
				payout_method,
				status: 'pending',
				description,
			}, req.organizationId);
		} catch (error) {
			logger.error('Webhook trigger failed:', error.message);
		}
	});

	res.status(201).json({
		id: payoutRecord.id,
		payout_id: payoutRecord.payout_id,
		organization_id: payoutRecord.organization_id,
		professional_id: payoutRecord.professional_id,
		amount: payoutRecord.amount,
		payout_method: payoutRecord.payout_method,
		status: payoutRecord.status,
		description: payoutRecord.description,
		payout_date: payoutRecord.payout_date,
		created_at: payoutRecord.created_at,
	});
});

export default router;
