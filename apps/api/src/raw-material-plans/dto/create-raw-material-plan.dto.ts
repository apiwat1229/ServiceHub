export class CreateRawMaterialPlanDto {
    planNo: string;
    revisionNo: string;
    refProductionNo: string;
    issuedDate: string | Date; // Accept string from frontend, convert in service
    rows: RawMaterialPlanRowDto[];
    poolDetails: RawMaterialPlanPoolDetailDto[];
    issueBy?: string; // Mapped to creator
    verifiedBy?: string; // Mapped to checker
    status?: string;
}

export class RawMaterialPlanRowDto {
    date: string | Date;
    dayOfWeek: string;
    shift: string;
    productionMode?: string;
    grade: string;

    ratioUSS?: number | string;
    ratioCL?: number | string;
    ratioBK?: number | string;

    productTarget?: number | string;
    clConsumption?: number | string;
    ratioBorC?: number | string;

    // Plan 1-3
    plan1Pool?: string[]; // Frontend sends array, Schema expects string? Or comma joined? Schema says String.
    plan1Scoops?: number;
    plan1Grades?: string[]; // Not in schema directly? 
    // Wait, Schema has plan1Pool String, plan1Note String. 
    // Frontend sends plan1Pool [], plan1Grades [].
    // I need to join them to string for storage or update schema.
    // Schema: plan1Pool String?
    // Let's assume we join them with commas or store JSON string if possible? 
    // Schema is String. I will join arrays with ',' in Service.

    plan2Pool?: string[];
    plan2Scoops?: number;
    plan2Grades?: string[];

    plan3Pool?: string[];
    plan3Scoops?: number;
    plan3Grades?: string[];

    cuttingPercent?: number | string;
    cuttingPalette?: number | string;

    remarks?: string;
}

export class RawMaterialPlanPoolDetailDto {
    poolNo: string;
    grossWeight?: number | string;
    netWeight?: number | string;
    drc?: number | string;
    moisture?: number | string;
    p0?: number | string;
    pri?: number | string;
    clearDate?: string | Date;
    grade?: string[] | string; // Frontend sends array
}
