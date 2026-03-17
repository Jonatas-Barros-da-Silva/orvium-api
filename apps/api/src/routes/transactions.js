import express from 'express';
import pb from '../utils/pocketbaseClient.js';

const router = express.Router();

router.get('/wallet/transactions', async (req, res) => {
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

	if (parsedLimit < 1 || parsedOffset < 0) {
		return res.status(400).json({ error: 'Invalid limit or offset' });
	}

	// Verify professional exists and belongs to organization
	let professional;
	try {
		professional = await pb.collection('professionals').getOne(professional_id);
		if (professional.organization_id !== req.organizationId) {
			return res.status(403).json({ error: 'Professional does not belong to this organization' });
		}
	} catch (error) {
		return res.status(404).json({ error: 'Professional not found' });
	}

	// Build filter
	let filter = `professional_id = "${professional_id}" && organization_id = "${req.organizationId}"`;

	if (transaction_type) {
		filter += ` && transaction_type = "${transaction_type}"`;
	}

	if (status) {
		filter += ` && status = "${status}"`;
	}

	if (from_date) {
		filter += ` && created >= "${from_date}"`;
	}

	if (to_date) {
		filter += ` && created <= "${to_date}"`;
	}

	// Query transactions
	const transactions = await pb.collection('wallet_transactions').getList(parsedOffset, parsedLimit, {
		filter,
		sort: '-created',
	});

	res.json({
		total_count: transactions.totalItems,
		limit: parsedLimit,
		offset: parsedOffset,
		transactions: transactions.items.map(t => ({
			id: t.id,
			professional_id: t.professional_id,
			transaction_type: t.transaction_type,
			amount: t.amount,
			status: t.status,
			description: t.description,
			created: t.created,
		})),
	});
});

export default router;
