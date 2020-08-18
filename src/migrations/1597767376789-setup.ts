import {MigrationInterface, QueryRunner} from "typeorm";

export class setup1597767376789 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
            --create role tenant_user with password 'postgres' login;

            create table test(
                id serial primary key,
                text text,
                tenant_id numeric
            );
            
            grant all on test to tenant_user;
            grant usage, select on all sequences in schema public TO tenant_user;
        `);

        /** we cast the parameter value to an integer to make sure it throws an exception if it is empty. */
        await queryRunner.query(`
            alter table test enable row level security;
            create policy test_tenant on test using (tenant_id = current_setting('tenant.id')::int);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {}
}
