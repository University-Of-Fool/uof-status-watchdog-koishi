import { Context, Schema } from 'koishi';
export declare const name = "uof-status-watchdog-koishi";
export interface Config {
    broadcastGroup: string;
    broadcastErrorOnly: boolean;
    detectInterval: number;
    uofsServer: string;
}
export declare const Config: Schema<Config>;
export declare function apply(ctx: Context, config: Config): Promise<void>;
