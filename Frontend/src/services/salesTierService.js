// Frontend/src/services/salesTierService.js

import { config } from '../config/api';

const API_URL = config.FULL_API_URL;
const BASE = `${API_URL}/sales-tiers`;

const getToken = () => localStorage.getItem('token');

const headers = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
});

const handleResponse = async (response) => {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Request failed');
    }
    return data;
};

// ═══════════════ TIERS ═══════════════
export const tierService = {
    getAll: async (includeInactive = false) => {
        const res = await fetch(`${BASE}/tiers?include_inactive=${includeInactive}`, { headers: headers() });
        return handleResponse(res);
    },
    create: async (tierData) => {
        const res = await fetch(`${BASE}/tiers`, {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify(tierData),
        });
        return handleResponse(res);
    },
    update: async (id, tierData) => {
        const res = await fetch(`${BASE}/tiers/${id}`, {
            method: 'PUT',
            headers: headers(),
            body: JSON.stringify(tierData),
        });
        return handleResponse(res);
    },
    delete: async (id) => {
        const res = await fetch(`${BASE}/tiers/${id}`, {
            method: 'DELETE',
            headers: headers(),
        });
        return handleResponse(res);
    },
};

// ═══════════════ SALES EMPLOYEES ═══════════════
// Frontend/src/services/salesTierService.js

export const salesEmployeeService = {
    getAll: async () => {
        const res = await fetch(`${BASE}/employees`, { headers: headers() });
        return handleResponse(res);
    },
    assign: async (employeeId, tierId, joinedDate) => {
        const res = await fetch(`${BASE}/employees`, {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify({
                employee_id: employeeId,
                tier_id: tierId,
                joined_date: joinedDate,
            }),
        });
        return handleResponse(res);
    },
    // ⭐ NEW: Bulk assign
    bulkAssign: async (employeeIds, tierId, joinedDate) => {
        const res = await fetch(`${BASE}/employees/bulk`, {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify({
                employee_ids: employeeIds,
                tier_id: tierId,
                joined_date: joinedDate,
            }),
        });
        return handleResponse(res);
    },
    remove: async (employeeId) => {
        const res = await fetch(`${BASE}/employees/${employeeId}`, {
            method: 'DELETE',
            headers: headers(),
        });
        return handleResponse(res);
    },
};
// ═══════════════ QUARTERS ═══════════════
export const quarterService = {
    getAll: async () => {
        const res = await fetch(`${BASE}/quarters`, { headers: headers() });
        return handleResponse(res);
    },
    create: async (data) => {
        const res = await fetch(`${BASE}/quarters`, {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },
    update: async (id, data) => {
        const res = await fetch(`${BASE}/quarters/${id}`, {
            method: 'PUT',
            headers: headers(),
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },
    delete: async (id) => {
        const res = await fetch(`${BASE}/quarters/${id}`, {
            method: 'DELETE',
            headers: headers(),
        });
        return handleResponse(res);
    },
    evaluate: async (id) => {
        const res = await fetch(`${BASE}/quarters/${id}/evaluate`, {
            method: 'POST',
            headers: headers(),
        });
        return handleResponse(res);
    },
    preview: async (id) => {
        const res = await fetch(`${BASE}/quarters/${id}/preview`, { headers: headers() });
        return handleResponse(res);
    },
};

// ═══════════════ PERFORMANCE ═══════════════
export const performanceService = {
    getByQuarter: async (quarterId) => {
        const url = quarterId
            ? `${BASE}/performance?quarter_id=${quarterId}`
            : `${BASE}/performance`;
        const res = await fetch(url, { headers: headers() });
        return handleResponse(res);
    },
    getTierHistory: async (employeeId) => {
        const res = await fetch(`${BASE}/tier-history/${employeeId}`, { headers: headers() });
        return handleResponse(res);
    },
};