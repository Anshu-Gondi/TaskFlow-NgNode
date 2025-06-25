import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiSchedulerComponent } from './ai-scheduler.component';

describe('AiSchedulerComponent', () => {
  let component: AiSchedulerComponent;
  let fixture: ComponentFixture<AiSchedulerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiSchedulerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AiSchedulerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
