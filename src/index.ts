
import { createConnection, Connection, Entity, PrimaryColumn, Column } from "typeorm";
import { TenantAwareQueryBuilder } from "./tenantAwareQueryBuilder";
import { SimpleConsoleLogger } from "./logger";

const pg_hostname = 'localhost'
const pg_port = 5558;

@Entity({name: "projects"})
export class ProjectRow{
    @PrimaryColumn({name: 'id'})
    id: string;
    @Column({name: 'name'})
    name: string;
    @Column({name: 'tenant_id'})
    tenantId: string;
}

async function setUp(){
    const adminConnection = await createConnection({
        type: "postgres",
        host: pg_hostname,
        port: pg_port,
        username: 'postgres',
        password: 'postgres',
        database: 'test',
        name: 'owner',
        schema: 'schema1',
        migrations: [`${__dirname}/migrations/*.js`]
    });

    await adminConnection.query(`
        drop schema if exists schema1 cascade;
    `);

    await adminConnection.query(`
        create schema schema1;
    `);

    await adminConnection.runMigrations();
}

function getTenantConnectionPool(){
    /** A different user is needed because RLS does not apply to the owner of the tables. */
    return createConnection({
        type: "postgres",
        host: pg_hostname,
        port: pg_port,
        username: 'tenant_user',
        password: 'postgres',
        database: 'test',
        name: 'tenant',
        schema: 'schema1',
        entities: [ProjectRow],
        logger: new SimpleConsoleLogger('all')
    });
}

async function addRow(pool: Connection, tenantId: number, text: string, rowTenantId: number){
    await TenantAwareQueryBuilder.query(pool, tenantId, `
        insert into schema1.projects (tenant_id, name) values ($1, $2);
    `, [rowTenantId, text]);
}

async function getAll(pool: Connection, tenantId: number){
    const qb = await TenantAwareQueryBuilder.create(pool, tenantId);
    return qb.select('t').from(ProjectRow, 't').getMany();
}

async function run(){
    await setUp();
    const pool = await getTenantConnectionPool();
    await queryWithoutTenantParameter(pool);

    await addRow(pool, 1, 'a', 1);
    await addRow(pool, 2, 'b', 2);
    
    const tenant1Data = await getAll(pool, 1);
    console.log('tenant 1 data',  tenant1Data);

    const tenant2Data = await getAll(pool, 2);
    console.log('tenant 2 data', tenant2Data);

    await queryWithoutTenantParameter(pool);
    await insertRowForAnotherTenant(pool);
}

async function queryWithoutTenantParameter(connectionPool: Connection){
    /** RLS blocks 'tenant_user' from making queries if 'tenant.id' is not defined. */
    try{
        const data = await connectionPool.query(`select * from schema1.projects`);
        console.log(data);
        throw 'should have thrown error';
    }catch(err){
        if(err === 'should have thrown error'){
            throw err;
        }
    }
}

async function insertRowForAnotherTenant(connectionPool: Connection){
    /** RLS blocks 'tenant_user' from adding rows to a tenant different than tenant.id */
    try{
        await addRow(connectionPool, 1, 'asd', 2);
        throw 'should have thrown error';
    }catch(err){
        if(err === 'should have thrown error'){
            throw err;
        }
    }
}

run().then(() => {
    console.log('\nALL GOOD');
    process.exit(0);
}).catch(err => console.error(err));
