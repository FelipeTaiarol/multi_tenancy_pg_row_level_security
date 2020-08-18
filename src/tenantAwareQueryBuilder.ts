import { SelectQueryBuilder, Connection, QueryRunner } from "typeorm";

export class TenantAwareQueryBuilder<T> extends SelectQueryBuilder<T>{
    private _queryRunner: QueryRunner;

    static async query(connection: Connection, tenantId: number, query: string, parameters: any[]){
        const queryRunner = await TenantAwareQueryBuilder.getQueryRunner(connection, tenantId);
        try{
            return await queryRunner.query(query, parameters);
        }finally{
            await this.releaseConnection(queryRunner);
        }
    }

    static async create<T>(connection: Connection, tenantId: number): Promise<SelectQueryBuilder<T>>{
        const queryRunner = await TenantAwareQueryBuilder.getQueryRunner(connection, tenantId);
        try{
            const instance = new TenantAwareQueryBuilder<T>(connection);
            instance._queryRunner = queryRunner;
            return instance;
        }catch(err){
            await this.releaseConnection(queryRunner);
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

    private constructor(connection: Connection){
        super(connection);
    }

    private static async releaseConnection(queryRunner: QueryRunner){
        await queryRunner.query(`reset tenant.id`);
        await queryRunner.release();
    }

    async getRawAndEntities<T = any>(): Promise<any> {
        const result = await super.getRawAndEntities();
        /** 
         * There is a small change of a race condition here.
         * getRawAndEntities already released the connection but we still need to reset this configuration parameter;
         */
        await this._queryRunner.connection.query(`reset tenant.id`);
        return result;
    }

    obtainQueryRunner(){
        return this._queryRunner;
    }
}
