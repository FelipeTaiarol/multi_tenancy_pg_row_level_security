import { SelectQueryBuilder, Connection, QueryRunner } from "typeorm";

export class TenantAwareQueryBuilder<T> extends SelectQueryBuilder<T>{
    private _queryRunner: QueryRunner;

    static async query(connection: Connection, tenantId: number, query: string, parameters: any[]){
        const queryRunner = await TenantAwareQueryBuilder.getQueryRunner(connection, tenantId);
        try{
            return await queryRunner.query(query, parameters);
        }finally{
            await TenantAwareQueryBuilder.releaseConnection(queryRunner);
        }
    }

    static async create<T>(connection: Connection, tenantId: number): Promise<SelectQueryBuilder<T>>{
        const queryRunner = await TenantAwareQueryBuilder.getQueryRunner(connection, tenantId);
        try{
            const instance = new TenantAwareQueryBuilder<T>(connection);
            instance._queryRunner = queryRunner;
            return instance;
        }catch(err){
            await TenantAwareQueryBuilder.releaseConnection(queryRunner);
            throw err
        }
    }

    static async getQueryRunner(connection: Connection, tenantId: number): Promise<QueryRunner>{
        const queryRunner = connection.createQueryRunner();
        await TenantAwareQueryBuilder.setTenantId(queryRunner, tenantId);
        return queryRunner;
    }

    static async setTenantId(queryRunner: QueryRunner, tenantId: number){
        queryRunner['TENANT_ID'] = tenantId; /** for debugging and logging */
        await queryRunner.query(`set tenant.id to ${tenantId}`, []);
    }

    private static async releaseConnection(queryRunner: QueryRunner){
        await TenantAwareQueryBuilder.resetTenantId(queryRunner);
        await queryRunner.release();
    }

    private static async resetTenantId(queryRunner: QueryRunner){
        await queryRunner.query(`reset tenant.id`);
    }

    private constructor(connection: Connection){
        super(connection);
    }

    async getRawAndEntities<T = any>(): Promise<any> {
        /**
         * Trying to make sure that the 'tenant.id' connection paramter is removed from the connection before
         * the connection is released to the pool.
         */
        const getData = super.getRawAndEntities();
        const resetParameter = TenantAwareQueryBuilder.resetTenantId(this._queryRunner);

        const result = await getData;
        await resetParameter;
        return result;
    }

    obtainQueryRunner(){
        return this._queryRunner;
    }
}
