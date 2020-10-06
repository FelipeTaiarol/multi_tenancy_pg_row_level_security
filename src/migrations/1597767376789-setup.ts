import {MigrationInterface, QueryRunner} from "typeorm";

export class setup1597767376789 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
            --create role tenant_user with password 'postgres' login;

            create table schema1.projects(
                id serial primary key,
                name text,
                tenant_id numeric
            );
                        
            grant all on  schema schema1 to tenant_user;
            grant all on schema1.projects to tenant_user;
            grant usage, select on all sequences in schema schema1 TO tenant_user;
            
        `);

        /** we cast the parameter value to an integer to make sure it throws an exception if it is empty. */
        await queryRunner.query(`
            alter table schema1.projects enable row level security;
            create policy projects_tenant on schema1.projects using (tenant_id = current_setting('tenant.id')::int);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {}
}
