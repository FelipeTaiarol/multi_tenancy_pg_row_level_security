import { SelectQueryBuilder, Connection, QueryRunner } from "typeorm";
import { Query } from "typeorm/driver/Query";

export class TenantAwareQueryBuilder<T> extends SelectQueryBuilder<T>{
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

    constructor(connection: Connection, private readonly tenantId: number){
        super(connection);
    }

    /**
     * Overrides the method to set the 'tenant.id' connection parameter.
     */
    protected async loadRawResults(queryRunner: QueryRunner){
        await TenantAwareQueryBuilder.setTenantId(queryRunner, this.tenantId);
        const data = await super.loadRawResults(queryRunner);
        await TenantAwareQueryBuilder.resetTenantId(queryRunner);
        return data;
    }
}
