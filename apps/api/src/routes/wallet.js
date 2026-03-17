import { Router } from 'express';
import pb from '../utils/pocketbaseClient.js';

const router = Router();

// GET /wallet/balance
const getBalance = async (req, res) => {
	const { professional_id } = req.query;

	// Validate required parameter
	if (!professional_id) {
		return res.status(400).json({ error: 'professional_id query parameter is required' });
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

	// Query professional_wallets
	let professionalWallet;
	try {
		professionalWallet = await pb.collection('professional_wallets').getFirstListItem(
			`professional_id="${professional_id}" && organization_id="${req.organizationId}"`
		);
	} catch (error) {
		throw new Error('Professional wallet not found');
	}

	// Query wallet_balances
	let walletBalance;
	try {
		walletBalance = await pb.collection('wallet_balances').getFirstListItem(
			`wallet_id="${professionalWallet.wallet_id}"`
		);
	} catch (error) {
		throw new Error('Wallet balance not found');
	}

	const totalBalance = (walletBalance.available_balance || 0) + (walletBalance.pending_balance || 0);

	res.json({
		professional_id,
		wallet_id: professionalWallet.wallet_id,
		available_balance: walletBalance.available_balance || 0,
		pending_balance: walletBalance.pending_balance || 0,
		total_balance: totalBalance,
		currency: walletBalance.currency || 'USD',
		last_updated: walletBalance.last_updated,
	});
};

// GET /wallet/transactions
const getTransactions = async (req, res) => {
	const {
		professional_id,
		limit = '50',
		offset = '0',
		transaction_type,
		status,
		from_date,
		to_date,
	} = req.query;

	// Validate required parameter
	if (!professional_id) {
		return res.status(400).json({ error: 'professional_id query parameter is required' });
	}

	// Validate and parse limit and offset
	const parsedLimit = Math.min(parseInt(limit, 10) || 50, 500);
	const parsedOffset = parseInt(offset, 10) || 0;

	if (parsedLimit < 1 || parsedLimit > 500 || parsedOffset < 0) {
		return res.status(400).json({ error: 'Invalid limit (1-500) or offset (>=0)' });
	}

	// Validate date formats if provided
	if (from_date && isNaN(Date.parse(from_date))) {
		return res.status(400).json({ error: 'Invalid from_date format (must be ISO 8601)' });
	}
	if (to_date && isNaN(Date.parse(to_date))) {
		return res.status(400).json({ error: 'Invalid to_date format (must be ISO 8601)' });
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

	// Query professional_wallets
	let professionalWallet;
	try {
		professionalWallet = await pb.collection('professional_wallets').getFirstListItem(
			`professional_id="${professional_id}" && organization_id="${req.organizationId}"`
		);
	} catch (error) {
		throw new Error('Professional wallet not found');
	}

	// Build filter
	let filter = `wallet_id="${professionalWallet.wallet_id}"`;

	if (transaction_type) {
		filter += ` && transaction_type="${transaction_type}"`;
	}

	if (status) {
		filter += ` && status="${status}"`;
	}

	if (from_date) {
		filter += ` && created_at>="${from_date}"`;
	}

	if (to_date) {
		filter += ` && created_at<="${to_date}"`;
	}

	// Query transactions
	const transactions = await pb.collection('wallet_transactions').getList(parsedOffset, parsedLimit, {
		filter,
		sort: '-created_at',
	});

	res.json({
		professional_id,
		total_count: transactions.totalItems,
		limit: parsedLimit,
		offset: parsedOffset,
		transactions: transactions.items.map(t => ({
			id: t.id,
			wallet_id: t.wallet_id,
			transaction_type: t.transaction_type,
			amount: t.amount,
			status: t.status,
			description: t.description,
			created_at: t.created_at,
		})),
	});
};

router.get('/wallet/balance', getBalance);
router.get('/wallet/transactions', getTransactions);

export default router;
export { getBalance, getTransactions };
