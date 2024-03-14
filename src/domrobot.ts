import * as otplib from 'otplib';

export class ApiClient {
    public static readonly CLIENT_VERSION = '3.1.0';

    public static readonly API_URL_LIVE = 'https://api.domrobot.com/jsonrpc/';
    public static readonly API_URL_OTE = 'https://api.ote.domrobot.com/jsonrpc/';

    public static generateClientTransactionId(): string {
        return 'DomRobot-' + Math.round(Math.random() * 1000000000);
    }

    private readonly apiUrl: string;
    private language: Language;
    private debugMode: boolean;

    private cookie: string;

    /**
     * @param apiUrl url of the API.
     * @param language default language for future API requests.
     * @param debugMode whether requests and responses should be printed out.
     */
    constructor(apiUrl: string = ApiClient.API_URL_OTE, language = Language.EN, debugMode: boolean = false) {
        this.apiUrl = apiUrl;
        this.language = language;
        this.debugMode = debugMode;
        this.cookie = null;
    }

    /**
     * Makes an API call.
     *
     * @param apiMethod The name of the method called in the API.
     * @param methodParams An object of parameters added to the request.
     * @param clientTransactionId Id sent with every request to distinguish your api requests in case you need support.
     * @param language Language for the API request. Default is value of field language.
     */
    public async callApi(
        apiMethod: string,
        methodParams: any = {},
        language: Language = this.language,
        clientTransactionId: string = ApiClient.generateClientTransactionId(),
    ): Promise<any> {
        if ('clTRID'! in methodParams && clientTransactionId !== null) {
            methodParams.clTRID = clientTransactionId;
        }
        if ('lang'! in methodParams) {
            methodParams.lang = language;
        }

        const requestBody = JSON.stringify({
            method: apiMethod,
            params: methodParams,
        });

        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: new Headers({
                'Content-Type': 'application/json',
                Cookie: this.cookie,
                'User-Agent': `DomRobot/${ApiClient.CLIENT_VERSION} (Node ${process.version})`,
            }),
            body: requestBody,
        });

        if (apiMethod === 'account.login') {
            this.cookie = response.headers.get('set-cookie');
        }

        const data = await response.json();
        if (this.debugMode) {
            console.info(`Request (${apiMethod}): ${requestBody}`);
            console.info(`Response (${apiMethod}): ${JSON.stringify(data, null, 2)}`);
        }

        return data;
    }

    /**
     * Performs a login at the API and saves the session for following API calls.
     *
     * @param username your username.
     * @param password your password.
     * @param sharedSecret
     */
    public async login(username: string, password: string, sharedSecret: string = null): Promise<any> {
        const loginResult = await this.callApi('account.login', {
            user: username,
            pass: password,
        });
        if (loginResult.code === 1000 && 'tfa' in loginResult.resData && loginResult.resData.tfa !== '0') {
            if (sharedSecret === null) {
                return Promise.reject('API requests two factor challenge but no shared secret is given. Aborting.');
            }
            const secretCode = otplib.authenticator.generate(sharedSecret);
            const unlockResult = await this.callApi('account.unlock', { tan: secretCode });
            if (unlockResult.code !== 1000) {
                return unlockResult;
            }
        }

        return loginResult;
    }

    /**
     * Performs a logout at the API and destroys the current session.
     */
    public async logout(): Promise<any> {
        return await this.callApi('account.logout').then(() => (this.cookie = null));
    }

    public getApiUrl(): string {
        return this.apiUrl;
    }

    public getLanguage(): string {
        return this.language;
    }

    public setLanguage(lang: Language) {
        this.language = lang;
    }

    public isDebugMode(): boolean {
        return this.debugMode;
    }

    public setDebugMode(value: boolean) {
        this.debugMode = value;
    }
}

/**
 * The API response-message language.
 */
export enum Language {
    EN = 'en',
    DE = 'de',
    ES = 'es',
}

export enum AccountApiMethods {
    // 2.1.1.
    Account_AddRole = 'account.addrole',
    // 2.1.2.
    Account_ChangePassword = 'account.changepassword',
    // 2.1.3.
    Account_Check = 'account.check',
    // 2.1.4.
    Account_Create = 'account.create',
    // 2.1.5.
    Account_Delete = 'account.delete',
    // 2.1.6.
    Account_GetRoles = 'account.getroles',
    // 2.1.7.
    Account_Info = 'account.info',
    // 2.1.8.
    Account_List = 'account.list',
    // 2.1.9.
    Account_Login = 'account.login',
    // 2.1.10.
    Account_Logout = 'account.logout',
    // 2.1.11.
    Account_RemoveRole = 'account.removerole',
    // 2.1.12.
    Account_Unlock = 'account.unlock',
    // 2.1.13.
    Account_Update = 'account.update',
}

export enum AccountingApiMethods {
    // 2.2.1.
    Accounting_AccountBalance = 'accounting.accountBalance',
    // 2.2.2.
    Accounting_CreditLogById = 'accounting.creditLogById',
    //2.2.3.
    Accounting_GetInvoice = 'accounting.getInvoice',
    // 2.2.4.
    Accounting_GetReceipt = 'accounting.getReceipt',
    // 2.2.5.
    Accounting_GetStatement = 'accounting.getstatement',
    // 2.2.6.
    Accounting_ListInvoices = 'accounting.listInvoices',
    // 2.2.7.
    Accounting_LockedFunds = 'accounting.lockedFunds',
    // 2.2.8.
    Accounting_Log = 'accounting.log',
    // 2.2.9.
    Accounting_Refund = 'accounting.refund',
    // 2.2.10.
    Accounting_SendByPost = 'accounting.sendbypost',
}

export enum ApplicationApiMethods {
    // 2.3.1.
    Application_Check = 'application.check',
    // 2.3.2.
    Application_Create = 'application.create',
    // 2.3.3.
    Application_Delete = 'application.delete',
    // 2.3.4.
    Application_Info = 'application.info',
    // 2.3.5.
    Application_List = 'application.list',
    // 2.3.6.
    Application_Update = 'application.update',
}

export enum Authinfo2ApiMethods {
    // 2.4.1.
    Authinfo2_Create = 'authinfo2.create',
    // 2.4.2.
    Authinfo2_GetPrice = 'authinfo2.getprice',
}

export enum CertificateApiMethods {
    // 2.5.1.
    Certificate_Cancel = 'certificate.cancel',
    // 2.5.2.
    Certificate_Create = 'certificate.create',
    // 2.5.3.
    Certificate_GetProduct = 'certificate.getProduct',
    // 2.5.4.
    Certificate_Info = 'certificate.info',
    // 2.5.5.
    Certificate_List = 'certificate.list',
    // 2.5.6.
    Certificate_ListProducts = 'certificate.listProducts',
    // 2.5.7.
    Certificate_ListRemainingNeededData = 'certificate.listRemainingNeededData',
    // 2.5.8.
    Certificate_Log = 'certificate.log',
    // 2.5.9.
    Certificate_Renew = 'certificate.renew',
    // 2.5.10.
    Certificate_SetAutorenew = 'certificate.setAutorenew',
    // 2.5.11.
    Certificate_SetResendApproval = 'certificate.setresendapproval',
    // 2.5.12.
    Certificate_UpdateOrder = 'certificate.updateOrder',
}

export enum ContactApiMethods {
    // 2.6.1.
    Contact_Create = 'contact.create',
    // 2.6.2.
    Contact_Delete = 'contact.delete',
    // 2.6.3.
    Contact_Info = 'contact.info',
    // 2.6.4.
    Contact_List = 'contact.list',
    // 2.6.5.
    Contact_Log = 'contact.log',
    // 2.6.6.
    Contact_SendContactVerification = 'contact.sendcontactverification',
    // 2.6.7.
    Contact_Update = 'contact.update',
}

export enum CustomerApiMethods {
    // 2.7.1.
    Customer_ContactVerificationSettingsInfo = 'customer.contactverificationsettingsinfo',
    // 2.7.2.
    Customer_ContactVerificationSettingsUpdate = 'customer.contactverificationsettingsupdate',
    // 2.7.3.
    Customer_Delete = 'customer.delete',
    // 2.7.4.
    Customer_Info = 'customer.info',
    // 2.7.5.
    Customer_ListDownloads = 'customer.listdownloads',
    // 2.7.6.
    Customer_RequestDataExport = 'customer.requestdataexport',
    // 2.7.7.
    Customer_Update = 'customer.update',
}

export enum DnssecApiMethods {
    // 2.8.1.
    Dnssec_AddDnsKey = 'dnssec.adddnskey',
    // 2.8.2.
    Dnssec_DeleteAll = 'dnssec.deleteall',
    // 2.8.3.
    Dnssec_DeleteDnsKey = 'dnssec.deletednskey',
    // 2.8.4.
    Dnssec_DisableDnsSec = 'dnssec.disablednssec',
    // 2.8.5.
    Dnssec_EnableDnsSec = 'dnssec.enablednssec',
    // 2.8.6.
    Dnssec_Info = 'dnssec.info',
    // 2.8.7.
    Dnssec_ListKeys = 'dnssec.listkeys',
}

export enum DomainApiMethods {
    // 2.9.1.
    Domain_Check = 'domain.check',
    // 2.9.2.
    Domain_Create = 'domain.create',
    // 2.9.3.
    Domain_Delete = 'domain.delete',
    // 2.9.4.
    Domain_GetAllDomainPrices = 'domain.getalldomainprices',
    // 2.9.5.
    Domain_GetDomainPrice = 'domain.getdomainprice',
    // 2.9.6.
    Domain_GetExtraDataRules = 'domain.getextradatarules',
    // 2.9.7.
    Domain_GetPrices = 'domain.getPrices',
    // 2.9.8.
    Domain_GetPromos = 'domain.getPromos',
    // 2.9.9.
    Domain_GetRules = 'domain.getRules',
    // 2.9.10.
    Domain_GetTldGroups = 'domain.getTldGroups',
    // 2.9.11.
    Domain_Info = 'domain.info',
    // 2.9.12.
    Domain_List = 'domain.list',
    // 2.9.13.
    Domain_Log = 'domain.log',
    // 2.9.14.
    Domain_PriceChanges = 'domain.priceChanges',
    // 2.9.15.
    Domain_Push = 'domain.push',
    // 2.9.16.
    Domain_Renew = 'domain.renew',
    // 2.9.17.
    Domain_Restore = 'domain.restore',
    // 2.9.18.
    Domain_Stats = 'domain.stats',
    // 2.9.19.
    Domain_Trade = 'domain.trade',
    // 2.9.20.
    Domain_Transfer = 'domain.transfer',
    // 2.9.21.
    Domain_TransferCancel = 'domain.transfercancel',
    // 2.9.22.
    Domain_TransferOut = 'domain.transferOut',
    // 2.9.23.
    Domain_Update = 'domain.update',
    // 2.9.24.
    Domain_Whois = 'domain.whois',
}

export enum DydnsApiMethods {
    // 2.10.1.
    Dyndns_Check = 'dyndns.check',
    // 2.10.2.
    Dyndns_Create = 'dyndns.create',
    // 2.10.3.
    Dyndns_Delete = 'dyndns.delete',
    // 2.10.4.
    Dyndns_Info = 'dyndns.info',
    // 2.10.5.
    Dyndns_List = 'dyndns.list',
    // 2.10.6.
    Dyndns_Log = 'dyndns.log',
    // 2.10.7.
    Dyndns_UpdateRecord = 'dyndns.updateRecord',
}

export enum DyndnsSubscriptionApiMethods {
    // 2.11.1.
    DyndnsSubscription_Cancel = 'dyndnssubscription.cancel',
    // 2.11.2.
    DyndnsSubscription_Create = 'dyndnssubscription.create',
    // 2.11.3.
    DyndnsSubscription_List = 'dyndnssubscription.list',
    // 2.11.4.
    DyndnsSubscription_ListProducts = 'dyndnssubscription.listProducts',
}

export enum HostApiMethods {
    // 2.12.1.
    Host_Check = 'host.check',
    // 2.12.2.
    Host_Create = 'host.create',
    // 2.12.3.
    Host_Delete = 'host.delete',
    // 2.12.4.
    Host_Info = 'host.info',
    // 2.12.5.
    Host_List = 'host.list',
    // 2.12.6.
    Host_Update = 'host.update',
}

export enum HostingApiMethods {
    // 2.13.1.
    Hosting_Cancel = 'hosting.cancel',
    // 2.13.2.
    Hosting_ControlPanel = 'hosting.controlPanel',
    // 2.13.3.
    Hosting_Create = 'hosting.create',
    // 2.13.4.
    Hosting_GetPrices = 'hosting.getPrices',
    // 2.13.5.
    Hosting_IsSuspended = 'hosting.issuspended',
    // 2.13.6.
    Hosting_List = 'hosting.list',
    // 2.13.7.
    Hosting_Reinstated = 'hosting.reinstate',
    // 2.13.8.
    Hosting_Unsuspend = 'hosting.unsuspend',
    // 2.13.9.
    Hosting_UpdatePeriod = 'hosting.updatePeriod',
}

export enum MessageApiMethods {
    // 2.14.1.
    Message_Ack = 'message.ack',
    // 2.14.2.
    Message_Poll = 'message.poll',
}

export enum NameserverApiMethods {
    // 2.15.1.
    Nameserver_Check = 'nameserver.check',
    // 2.15.2.
    Nameserver_Create = 'nameserver.create',
    // 2.15.3.
    Nameserver_CreateRecord = 'nameserver.createRecord',
    // 2.15.4.
    Nameserver_Delete = 'nameserver.delete',
    // 2.15.5.
    Nameserver_DeleteRecord = 'nameserver.deleteRecord',
    // 2.15.6.
    Nameserver_Export = 'nameserver.export',
    // 2.15.7.
    Nameserver_ExportList = 'nameserver.exportlist',
    // 2.15.8.
    Nameserver_ExportRecords = 'nameserver.exportrecords',
    // 2.15.9.
    Nameserver_Info = 'nameserver.info',
    // 2.15.10.
    Nameserver_List = 'nameserver.list',
    // 2.15.11.
    Nameserver_Update = 'nameserver.update',
    // 2.15.12.
    Nameserver_UpdateRecord = 'nameserver.updateRecord',
}

export enum NameserverSetApiMethods {
    // 2.16.1.
    NameserverSet_Create = 'nameserverset.create',
    // 2.16.2.
    NameserverSet_Delete = 'nameserverset.delete',
    // 2.16.3.
    NameserverSet_Info = 'nameserverset.info',
    // 2.16.4.
    NameserverSet_List = 'nameserverset.list',
    // 2.16.5.
    NameserverSet_Update = 'nameserverset.update',
}

export enum NewsApiMethods {
    // 2.17.1.
    News_List = 'news.list',
}

export enum NichandleApiMethods {
    // 2.18.1.
    Nichandle_List = 'nichandle.list',
}

export enum PdfApiMethods {
    // 2.19.1.
    Pdf_Document = 'pdf.document',
    // 2.19.2.
    Pdf_Get = 'pdf.get',
}

export enum TagApiMethods {
    // 2.20.1.
    Tag_Create = 'tag.create',
    // 2.20.2.
    Tag_Delete = 'tag.delete',
    // 2.20.3.
    Tag_Info = 'tag.info',
    // 2.20.4.
    Tag_List = 'tag.list',
    // 2.20.5.
    Tag_Update = 'tag.update',
}

// const ApiMethods = {
//     ...AccountApiMethods,
//     ...AccountingApiMethods,
//     ...ApplicationApiMethods,
//     ...Authinfo2ApiMethods,
//     ...CertificateApiMethods,
//     ...ContactApiMethods,
//     ...CustomerApiMethods,
//     ...DnssecApiMethods,
//     ...DomainApiMethods,
// };

// export type ApiMethods = typeof ApiMethods;
