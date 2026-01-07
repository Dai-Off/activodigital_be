import { vi } from 'vitest';

vi.mock('../web/middlewares/authMiddleware', () => {
    const authMock = (req: any, res: any, next: any) => {
        req.user = {
            // id: 'bb74fa64-5d36-40a8-ae49-c2ef4705cc1b', email: 'jolekis312@burangir.com', 
            id: '07e96f48-de34-40a0-9f98-d1582bc20162', // Rol de tecnico
            email: 'martiingadeea1996@gmail.com', 
        };
        next();
    };

    return {
        authenticateToken: authMock,
        requireAuth: authMock
    };
});


vi.mock('../domain/trazability/TrazabilityService', () => ({
    trazabilityService: {
        registerTrazability: vi.fn(() => Promise.resolve(true))
    }
}));