import { Component, NgModule } from '@angular/core';

@Component({
  selector: 'loading-indicator',
  templateUrl: './loading-indicator.component.html',
  styleUrls: ['./loading-indicator.component.scss']
})
export class LoadingIndicatorComponent {
}
@NgModule({
  declarations: [LoadingIndicatorComponent],
  exports: [LoadingIndicatorComponent]
})
export class LoadingIndicatorModule {
}
