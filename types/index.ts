export interface Driver {
    id: number;
    driver_code: string; // 4자리 고유코드
    name: string;
    phone: string;
    photo?: string; // Base64 or URL
    status: '운행' | '휴직' | '퇴사';
    role: 'admin' | 'manager' | 'driver';
    created_at: string;
    updated_at: string;
    // 현재 운용방식 (JOIN 결과)
    current_work?: DriverWorkHistory;
}

export interface DriverWorkHistory {
    id: number;
    driver_id: number;
    work_start_date: string; // YYMMDD
    work_type: '일차' | '격일A' | '격일B';
    created_at: string;
}

export interface DriverWithHistory extends Driver {
    work_history: DriverWorkHistory[];
}

export interface DriverListResponse {
    success: boolean;
    drivers: Driver[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface DriverResponse {
    success: boolean;
    driver?: DriverWithHistory;
    message?: string;
}

export interface WorkHistoryResponse {
    success: boolean;
    history?: DriverWorkHistory;
    message?: string;
}

export interface Vehicle {
    id: number;
    vehicle_number: string;
    vehicle_type: string;
    registration_date: string;
    status: '운행가능' | '정비중' | '폐차';
    created_at?: string;
    updated_at?: string;
}

export interface Assignment {
    id: number;
    assignment_date: string;
    driver_id: number;
    vehicle_id: number;
    shift: '주간' | '야간' | '전일';
    notes?: string;
    created_at?: string;
    updated_at?: string;
    // 조인 데이터
    driver?: Driver;
    vehicle?: Vehicle;
}

export interface LoginCredentials {
    phone: string;
    password: string;
}

export interface AuthResponse {
    success: boolean;
    token?: string;
    user?: {
        id: number;
        name: string;
        phone: string;
        role: 'admin' | 'manager' | 'driver';
    };
    message?: string;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}
