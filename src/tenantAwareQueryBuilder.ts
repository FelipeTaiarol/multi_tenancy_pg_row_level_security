import { SelectQueryBuilder, Connection, QueryRunner } from "typeorm";

export class TenantAwareQueryBuilder<T> extends SelectQueryBuilder<T>{
    private readonly tenantId: number;
    
    static async query(connection: Connection, tenantId: number, query: string, parameters: any[]){
        const queryRunner = connection.createQueryRunner();
        try{
            await TenantAwareQueryBuilder.setTenantId(queryRunner, tenantId);
            return await queryRunner.query(query, parameters);
        }finally{
            await TenantAwareQueryBuilder.resetTenantId(queryRunner);
            await queryRunner.release();
        }
    }

    static async setTenantId(queryRunner: QueryRunner, tenantId: number){
        queryRunner['TENANT_ID'] = tenantId; /** for debugging and logging */
        await queryRunner.query(`set tenant.id to ${tenantId}`, []);
    }

    private static async resetTenantId(queryRunner: QueryRunner){
        await queryRunner.query(`reset tenant.id`);
        queryRunner['TENANT_ID'] = undefined;
    }

    constructor(connection: Connection, tenantId: number){
        super(connection);
        this.tenantId = tenantId;
    }

    /**
     * Overrides the methods to set the 'tenant.id' connection parameter.
     */
    protected async executeEntitiesAndRawResults(queryRunner: QueryRunner): Promise<{ entities: any[], raw: any[] }> {
        await queryRunner.query(`set tenant.id to ${this.tenantId}`, []);
        const data = await super.executeEntitiesAndRawResults(queryRunner);
        await TenantAwareQueryBuilder.resetTenantId(queryRunner);
        return data;
    }
}
