import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject, EMPTY, interval, Observable, Subscription } from "rxjs";
import { catchError, delay, map, retry, startWith, switchMap } from "rxjs/operators";
import xml2js from "xml2js";

@Injectable({
    providedIn: "root"
})
export class ExchangeRateService {
    private readonly currencyRatesUrl = "https://www.cbr-xml-daily.ru/daily_utf8.xml";
    private readonly currencyRatesUrlAlternative = "https://www.cbr-xml-daily.ru/daily_json.js";

    private readonly defaultInterval = 10000;

    private readonly subscriptions = new Subscription();

    private readonly dataLoadedSubject = new BehaviorSubject<boolean>(false);
    public readonly datdLoadedChanged = this.dataLoadedSubject.asObservable();

    private readonly failedDataLoadingMessageSubject = new BehaviorSubject<string>(null);
    public readonly failedDataLoadingMessageChanged = this.failedDataLoadingMessageSubject.asObservable();

    private readonly currencyRatesDataSubject = new BehaviorSubject<CurrencyRateData>(null);
    public readonly currencyRatesDataChanged = this.currencyRatesDataSubject.asObservable();

    constructor(
        private readonly httpClient: HttpClient
    ) {
    }

    public subscribeOnRtd() {
        const dataSubscription = interval(this.defaultInterval).pipe(
            startWith(null),
            delay(4000), // emulating data loading
            switchMap(() => this.loadingRateData()),
            catchError(error => {
                this.failedDataLoadingMessageSubject.next(`Data is not available at this time...`);
                console.error(error);
                return EMPTY;
            })
        ).subscribe(() => {});
        this.subscriptions.add(dataSubscription);
    }

    private loadingRateData(): Observable<boolean> {
        const headers = new HttpHeaders({
            "Accept": "text/html, application/xhtml+xml, */*",
            "Content-Type": "text/plain; charset=utf-8",
        });
        const options = { headers, responseType: "text" as "json" };
        return this.httpClient.get<CurrencyRateData>(this.currencyRatesUrl, options).pipe(
            map(res => xml2js.parseString(res, { explicitArray: true }, (error, parsedXml) => {
                this.dataLoadedSubject.next(false);
                if (error) {
                    this.failedDataLoadingMessageSubject.next(`Failed parse xml response`);
                    this.dataLoadedSubject.next(true);
                    throw new Error(`Failed parse xml ${error}`);
                }
                if (parsedXml?.ValCurs?.length != 0) {
                    this.dataLoadedSubject.next(true);
                    this.currencyRatesDataSubject.next(parsedXml?.ValCurs);
                }
                return true;
            })),
            catchError((error) => this.switchToAlternative(error, headers)),
            retry(3)
        );
    }

    private switchToAlternative(error: Error, headers: HttpHeaders): Observable<boolean> {
        console.error(`https://www.cbr-xml-daily is not available at this time ${error}`);
        return this.httpClient.get<CurrencyRateDataAlternative>(this.currencyRatesUrlAlternative, { headers }).pipe(
            map(res => {
                this.failedDataLoadingMessageSubject.next(`Switching to alternative source`);
                const currencies: CurrencyItem[] = [];
                for (const prop in res.Valute) {
                    currencies.push(res.Valute[prop])
                }
                if (res.Valute != null) {
                    this.dataLoadedSubject.next(true);
                    this.currencyRatesDataSubject.next(
                        <CurrencyRateData>{
                            Valute: currencies
                        }
                    );
                }
                return true;
            }),
            catchError((err) => {
                this.failedDataLoadingMessageSubject.next(`Data is not available at this time...`);
                this.dataLoadedSubject.next(true);
                throw new Error(`Data is not available at this time ${err}`)
            }),
            retry(3)
        )
    }

    public destroy() {
        this.subscriptions.unsubscribe();
    }
}

export interface CurrencyRateData {
    $: { Date: string, Name: string };
    Valute: CurrencyItem[];
}

interface CurrencyItem {
    $: { ID: string };
    Name: string;
    Nominal: string;
    NumCode: string;
    Value: string;
}

export interface CurrencyRateDataAlternative {
    Date: string,
    PreviousDate: string,
    PreviousURL: string,
    Timestamp: string,
    Valute: { [key: string]: CurrencyItem };
}
