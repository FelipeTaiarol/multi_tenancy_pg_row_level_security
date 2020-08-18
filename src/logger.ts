import { Logger, QueryRunner } from "typeorm";
import { LoggerOptions } from "typeorm/logger/LoggerOptions";


export class SimpleConsoleLogger implements Logger {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private options?: LoggerOptions) {}

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Logs query and parameters used in it.
     */
    logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {
        if (this.options === "all" || this.options === true || (this.options instanceof Array && this.options.indexOf("query") !== -1)) {
            const sql = query + (parameters && parameters.length ? " -- PARAMETERS: " + this.stringifyParams(parameters) : "");
            console.log(this.getMoreInfo(queryRunner) + "query" + ": " + sql);
        }
    }

    /**
     * Logs query that is failed.
     */
    logQueryError(error: string, query: string, parameters?: any[], queryRunner?: QueryRunner) {
        if (this.options === "all" || this.options === true || (this.options instanceof Array && this.options.indexOf("error") !== -1)) {
            const sql = query + (parameters && parameters.length ? " -- PARAMETERS: " + this.stringifyParams(parameters) : "");
            console.log(this.getMoreInfo(queryRunner) + `query failed: ` + sql, `error:`, error);
        }
    }

    /**
     * Logs query that is slow.
     */
    logQuerySlow(time: number, query: string, parameters?: any[], queryRunner?: QueryRunner) {
        const sql = query + (parameters && parameters.length ? " -- PARAMETERS: " + this.stringifyParams(parameters) : "");
        console.log(this.getMoreInfo(queryRunner) + `query is slow: [${time}ms] ` + sql);
    }

    /**
     * Logs events from the schema build process.
     */
    logSchemaBuild(message: string, queryRunner?: QueryRunner) {
        console.log(`DB Migration `, message);
    }

    /**
     * Logs events from the migrations run process.
     */
    logMigration(message: string, queryRunner?: QueryRunner) {
        console.log(message);
    }

    /**
     * Perform logging using given logger, or by default to the console.
     * Log has its own level and message.
     */
    log(level: "log"|"info"|"warn", message: any, queryRunner?: QueryRunner) {
        switch (level) {
            case "log":
                if (this.options === "all" || (this.options instanceof Array && this.options.indexOf("log") !== -1))
                    console.log(new Date(), this.getMoreInfo(queryRunner) + message);
                break;
            case "info":
                if (this.options === "all" || (this.options instanceof Array && this.options.indexOf("info") !== -1))
                    console.info(new Date(), this.getMoreInfo(queryRunner) + message);
                break;
            case "warn":
                if (this.options === "all" || (this.options instanceof Array && this.options.indexOf("warn") !== -1))
                    console.warn(new Date(), this.getMoreInfo(queryRunner) + message);
                break;
        }
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Converts parameters to a string.
     * Sometimes parameters can have circular objects and therefor we are handle this case too.
     */
    protected stringifyParams(parameters: any[]) {
        try {
            return JSON.stringify(parameters);
        } catch (error) { // most probably circular objects in parameters
            return parameters;
        }
    }

    private getMoreInfo(queryRunner: QueryRunner): string{
        const processID = (<any>queryRunner).databaseConnection.processID;
        return `DBProcessId=${processID} TenantId=${queryRunner['TENANT_ID']} `;
    }
}
