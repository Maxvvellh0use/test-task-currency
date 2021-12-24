import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, NgModule, OnDestroy, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { LoadingIndicatorModule } from '../loading-indicator/loading-indicator.component';
import { CurrencyRateData, ExchangeRateService } from './exchange-rate.service';

@Component({
  selector: 'app-exchange-rate',
  templateUrl: './exchange-rate.component.html',
  styleUrls: ['./exchange-rate.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExchangeRateComponent implements OnInit, OnDestroy {
  public currencyRatesStream: Observable<CurrencyRateData>;
  public dataLoadedStream: Observable<Boolean>;
  public failedDataLoadingMessageStream: Observable<string>;

  constructor(
    private readonly exchangeRateService: ExchangeRateService
  ) {
  }

  public ngOnInit(): void {
    this.dataLoadedStream = this.exchangeRateService.datdLoadedChanged;
    this.currencyRatesStream = this.exchangeRateService.currencyRatesDataChanged;
    this.failedDataLoadingMessageStream = this.exchangeRateService.failedDataLoadingMessageChanged.pipe(
      shareReplay()
    )
    this.exchangeRateService.subscribeOnRtd();
  }

  public ngOnDestroy(): void {
      this.exchangeRateService.destroy();
  }
}

@NgModule({
  declarations: [ExchangeRateComponent],
  exports: [ExchangeRateComponent],
  imports: [
    CommonModule,
    LoadingIndicatorModule
  ]
})
export class ExchangeRateModule {
}
