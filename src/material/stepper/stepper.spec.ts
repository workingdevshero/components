import {Direction} from '@angular/cdk/bidi';
import {
  DOWN_ARROW,
  END,
  ENTER,
  HOME,
  LEFT_ARROW,
  RIGHT_ARROW,
  SPACE,
  UP_ARROW,
} from '@angular/cdk/keycodes';
import {_supportsShadowDom} from '@angular/cdk/platform';
import {
  CdkStep,
  STEPPER_GLOBAL_OPTIONS,
  STEP_STATE,
  StepperOrientation,
} from '@angular/cdk/stepper';
import {
  createKeyboardEvent,
  dispatchEvent,
  dispatchKeyboardEvent,
  provideFakeDirectionality,
} from '@angular/cdk/testing/private';
import {
  Component,
  DebugElement,
  Provider,
  QueryList,
  Type,
  ViewChild,
  ViewChildren,
  ViewEncapsulation,
  WritableSignal,
  inject,
  signal,
} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {By} from '@angular/platform-browser';
import {Observable, Subject, merge} from 'rxjs';
import {map, take} from 'rxjs/operators';
import {MATERIAL_ANIMATIONS, MatRipple, ThemePalette} from '../core';
import {MatInputModule} from '../input';
import {MatStepHeader, MatStepperModule} from './index';
import {MatStep, MatStepper} from './stepper';
import {MatStepperNext, MatStepperPrevious} from './stepper-button';
import {MatStepperIntl} from './stepper-intl';

const VALID_REGEX = /valid/;
let dir: WritableSignal<Direction>;

describe('MatStepper', () => {
  beforeEach(() => {
    dir = signal('ltr');
  });

  describe('basic stepper', () => {
    let fixture: ComponentFixture<SimpleMatVerticalStepperApp>;

    beforeEach(() => {
      fixture = createComponent(SimpleMatVerticalStepperApp);
      fixture.detectChanges();
    });

    it('should default to the first step', () => {
      expect(fixture.componentInstance.stepper.selectedIndex).toBe(0);
    });

    it('should throw when a negative `selectedIndex` is assigned', () => {
      expect(() => {
        fixture.componentInstance.stepper.selectedIndex = -10;
        fixture.detectChanges();
      }).toThrowError(/Cannot assign out-of-bounds/);
    });

    it('should throw when an out-of-bounds `selectedIndex` is assigned', () => {
      expect(() => {
        fixture.componentInstance.stepper.selectedIndex = 1337;
        fixture.detectChanges();
      }).toThrowError(/Cannot assign out-of-bounds/);
    });

    it('should change selected index on header click', () => {
      const stepHeaders = fixture.debugElement.queryAll(By.css('.mat-vertical-stepper-header'));
      const stepper = fixture.componentInstance.stepper;

      expect(stepper.selectedIndex).toBe(0);
      expect(stepper.selected instanceof MatStep).toBe(true);

      // select the second step
      let stepHeaderEl = stepHeaders[1].nativeElement;
      stepHeaderEl.click();
      fixture.detectChanges();

      expect(stepper.selectedIndex).toBe(1);
      expect(stepper.selected instanceof MatStep).toBe(true);

      // select the third step
      stepHeaderEl = stepHeaders[2].nativeElement;
      stepHeaderEl.click();
      fixture.detectChanges();

      expect(stepper.selectedIndex).toBe(2);
      expect(stepper.selected instanceof MatStep).toBe(true);
    });

    it('should set the "tablist" role on stepper', () => {
      const stepperEl = fixture.debugElement.query(By.css('mat-stepper'))!.nativeElement;
      expect(stepperEl.getAttribute('role')).toBe('tablist');
    });

    it('should display the correct label', () => {
      let selectedLabel = fixture.nativeElement.querySelector('[aria-selected="true"]');
      expect(selectedLabel.textContent).toMatch('Step 1');

      fixture.componentInstance.stepper.selectedIndex = 2;
      fixture.detectChanges();

      selectedLabel = fixture.nativeElement.querySelector('[aria-selected="true"]');
      expect(selectedLabel.textContent).toMatch('Step 3');

      fixture.componentInstance.inputLabel.set('New Label');
      fixture.detectChanges();

      selectedLabel = fixture.nativeElement.querySelector('[aria-selected="true"]');
      expect(selectedLabel.textContent).toMatch('New Label');
    });

    it('should go to next available step when the next button is clicked', () => {
      const stepper = fixture.componentInstance.stepper;

      expect(stepper.selectedIndex).toBe(0);

      let nextButtonNativeEl = fixture.debugElement.queryAll(By.directive(MatStepperNext))[0]
        .nativeElement;
      nextButtonNativeEl.click();
      fixture.detectChanges();

      expect(stepper.selectedIndex).toBe(1);

      nextButtonNativeEl = fixture.debugElement.queryAll(By.directive(MatStepperNext))[1]
        .nativeElement;
      nextButtonNativeEl.click();
      fixture.detectChanges();

      expect(stepper.selectedIndex).toBe(2);

      nextButtonNativeEl = fixture.debugElement.queryAll(By.directive(MatStepperNext))[2]
        .nativeElement;
      nextButtonNativeEl.click();
      fixture.detectChanges();

      expect(stepper.selectedIndex).toBe(2);
    });

    it('should set the next stepper button type to "submit"', () => {
      const button = fixture.debugElement.query(By.directive(MatStepperNext))!.nativeElement;
      expect(button.type)
        .withContext(`Expected the button to have "submit" set as type.`)
        .toBe('submit');
    });

    it('should go to previous available step when the previous button is clicked', () => {
      const stepper = fixture.componentInstance.stepper;

      expect(stepper.selectedIndex).toBe(0);

      stepper.selectedIndex = 2;
      let previousButtonNativeEl = fixture.debugElement.queryAll(
        By.directive(MatStepperPrevious),
      )[2].nativeElement;
      previousButtonNativeEl.click();
      fixture.detectChanges();

      expect(stepper.selectedIndex).toBe(1);

      previousButtonNativeEl = fixture.debugElement.queryAll(By.directive(MatStepperPrevious))[1]
        .nativeElement;
      previousButtonNativeEl.click();
      fixture.detectChanges();

      expect(stepper.selectedIndex).toBe(0);

      previousButtonNativeEl = fixture.debugElement.queryAll(By.directive(MatStepperPrevious))[0]
        .nativeElement;
      previousButtonNativeEl.click();
      fixture.detectChanges();

      expect(stepper.selectedIndex).toBe(0);
    });

    it('should set the previous stepper button type to "button"', () => {
      const button = fixture.debugElement.query(By.directive(MatStepperPrevious))!.nativeElement;
      expect(button.type)
        .withContext(`Expected the button to have "button" set as type.`)
        .toBe('button');
    });

    it('should set the correct step position for animation', () => {
      const stepper = fixture.componentInstance.stepper;

      expect(stepper._getAnimationDirection(0)).toBe('current');
      expect(stepper._getAnimationDirection(1)).toBe('next');
      expect(stepper._getAnimationDirection(2)).toBe('next');

      stepper.selectedIndex = 1;
      fixture.detectChanges();

      expect(stepper._getAnimationDirection(0)).toBe('previous');
      expect(stepper._getAnimationDirection(2)).toBe('next');
      expect(stepper._getAnimationDirection(1)).toBe('current');

      stepper.selectedIndex = 2;
      fixture.detectChanges();

      expect(stepper._getAnimationDirection(0)).toBe('previous');
      expect(stepper._getAnimationDirection(1)).toBe('previous');
      expect(stepper._getAnimationDirection(2)).toBe('current');
    });

    it('should not set focus on header of selected step if header is not clicked', () => {
      const stepper = fixture.componentInstance.stepper;
      const stepHeaderEl = fixture.debugElement.queryAll(By.css('mat-step-header'))[1]
        .nativeElement;
      const nextButtonNativeEl = fixture.debugElement.queryAll(By.directive(MatStepperNext))[0]
        .nativeElement;
      spyOn(stepHeaderEl, 'focus');
      nextButtonNativeEl.click();
      fixture.detectChanges();

      expect(stepper.selectedIndex).toBe(1);
      expect(stepHeaderEl.focus).not.toHaveBeenCalled();
    });

    it('should focus next step header if focus is inside the stepper', () => {
      const stepper = fixture.componentInstance.stepper;
      const stepHeaderEl = fixture.debugElement.queryAll(By.css('mat-step-header'))[1]
        .nativeElement;
      const nextButtonNativeEl = fixture.debugElement.queryAll(By.directive(MatStepperNext))[0]
        .nativeElement;
      spyOn(stepHeaderEl, 'focus');
      nextButtonNativeEl.focus();
      nextButtonNativeEl.click();
      fixture.detectChanges();

      expect(stepper.selectedIndex).toBe(1);
      expect(stepHeaderEl.focus).toHaveBeenCalled();
    });

    it('should focus next step header if focus is inside the stepper with shadow DOM', () => {
      if (!_supportsShadowDom()) {
        return;
      }

      fixture.destroy();
      TestBed.resetTestingModule();
      fixture = createComponent(SimpleMatVerticalStepperApp, [], ViewEncapsulation.ShadowDom);
      fixture.detectChanges();

      const stepper = fixture.componentInstance.stepper;
      const stepHeaderEl = fixture.debugElement.queryAll(By.css('mat-step-header'))[1]
        .nativeElement;
      const nextButtonNativeEl = fixture.debugElement.queryAll(By.directive(MatStepperNext))[0]
        .nativeElement;
      spyOn(stepHeaderEl, 'focus');
      nextButtonNativeEl.focus();
      nextButtonNativeEl.click();
      fixture.detectChanges();

      expect(stepper.selectedIndex).toBe(1);
      expect(stepHeaderEl.focus).toHaveBeenCalled();
    });

    it('should only be able to return to a previous step if it is editable', () => {
      const stepper = fixture.componentInstance.stepper;

      stepper.selectedIndex = 1;
      stepper.steps.toArray()[0].editable = false;
      const previousButtonNativeEl = fixture.debugElement.queryAll(
        By.directive(MatStepperPrevious),
      )[1].nativeElement;
      previousButtonNativeEl.click();
      fixture.detectChanges();

      expect(stepper.selectedIndex).toBe(1);

      stepper.steps.toArray()[0].editable = true;
      previousButtonNativeEl.click();
      fixture.detectChanges();

      expect(stepper.selectedIndex).toBe(0);
    });

    it('should set create icon if step is editable and completed', () => {
      const stepper = fixture.componentInstance.stepper;
      const nextButtonNativeEl = fixture.debugElement.queryAll(By.directive(MatStepperNext))[0]
        .nativeElement;
      expect(stepper.steps.first.indicatorType()).toBe('number');
      stepper.steps.toArray()[0].editable = true;
      nextButtonNativeEl.click();
      fixture.detectChanges();

      expect(stepper.steps.first.indicatorType()).toBe('edit');
    });

    it('should set done icon if step is not editable and is completed', () => {
      const stepper = fixture.componentInstance.stepper;
      const nextButtonNativeEl = fixture.debugElement.queryAll(By.directive(MatStepperNext))[0]
        .nativeElement;
      expect(stepper.steps.first.indicatorType()).toBe('number');
      stepper.steps.toArray()[0].editable = false;
      nextButtonNativeEl.click();
      fixture.detectChanges();

      expect(stepper.steps.first.indicatorType()).toBe('done');
    });

    it('should emit an event when the enter animation is done', () => {
      const stepper = fixture.componentInstance.stepper;
      const selectionChangeSpy = jasmine.createSpy('selectionChange spy');
      const animationDoneSpy = jasmine.createSpy('animationDone spy');
      const selectionChangeSubscription = stepper.selectionChange.subscribe(selectionChangeSpy);
      const animationDoneSubscription = stepper.animationDone.subscribe(animationDoneSpy);

      stepper.selectedIndex = 1;
      fixture.detectChanges();

      expect(selectionChangeSpy).toHaveBeenCalledTimes(1);
      expect(animationDoneSpy).toHaveBeenCalledTimes(1);

      selectionChangeSubscription.unsubscribe();
      animationDoneSubscription.unsubscribe();
    });

    it('should set the correct aria-posinset and aria-setsize', () => {
      const headers = Array.from<HTMLElement>(
        fixture.nativeElement.querySelectorAll('.mat-step-header'),
      );

      expect(headers.map(header => header.getAttribute('aria-posinset'))).toEqual(['1', '2', '3']);
      expect(headers.every(header => header.getAttribute('aria-setsize') === '3')).toBe(true);
    });

    it('should adjust the index when removing a step before the current one', () => {
      const stepper = fixture.componentInstance.stepper;

      stepper.selectedIndex = 2;
      fixture.detectChanges();

      // Re-assert since the setter has some extra logic.
      expect(stepper.selectedIndex).toBe(2);

      expect(() => {
        fixture.componentInstance.showStepTwo.set(false);
        fixture.detectChanges();
      }).not.toThrow();

      expect(stepper.selectedIndex).toBe(1);
    });

    it('should not do anything when pressing the ENTER key with a modifier', () => {
      const stepHeaders = fixture.debugElement.queryAll(By.css('.mat-vertical-stepper-header'));
      assertSelectKeyWithModifierInteraction(fixture, stepHeaders, 'vertical', ENTER);
    });

    it('should not do anything when pressing the SPACE key with a modifier', () => {
      const stepHeaders = fixture.debugElement.queryAll(By.css('.mat-vertical-stepper-header'));
      assertSelectKeyWithModifierInteraction(fixture, stepHeaders, 'vertical', SPACE);
    });

    it('should have a focus indicator', () => {
      const stepHeaderNativeElements = [
        ...fixture.debugElement.nativeElement.querySelectorAll('.mat-vertical-stepper-header'),
      ];

      expect(
        stepHeaderNativeElements.every(element => element.querySelector('.mat-focus-indicator')),
      ).toBe(true);
    });

    it('should hide the header icons from assistive technology', () => {
      const icon = fixture.nativeElement.querySelector('.mat-step-icon span');
      expect(icon.getAttribute('aria-hidden')).toBe('true');
    });

    it('should add units to unit-less values passed in to animationDuration', () => {
      const stepper = fixture.componentInstance.stepper;
      stepper.animationDuration = '1337';
      expect(stepper.animationDuration).toBe('1337ms');
    });
  });

  describe('basic stepper when attempting to set the selected step too early', () => {
    it('should not throw', () => {
      const fixture = createComponent(SimpleMatVerticalStepperApp);
      const stepper: MatStepper = fixture.debugElement.query(
        By.css('mat-stepper'),
      )!.componentInstance;

      expect(() => stepper.selected).not.toThrow();
    });
  });

  describe('basic stepper when attempting to set the selected step too early', () => {
    it('should not throw', () => {
      const fixture = createComponent(SimpleMatVerticalStepperApp);
      const stepper: MatStepper = fixture.debugElement.query(
        By.css('mat-stepper'),
      )!.componentInstance;

      expect(() => (stepper.selected = null!)).not.toThrow();
      expect(stepper.selectedIndex).toBe(-1);
    });
  });

  describe('basic stepper with i18n label change', () => {
    let i18nFixture: ComponentFixture<SimpleMatHorizontalStepperApp>;

    beforeEach(() => {
      i18nFixture = createComponent(SimpleMatHorizontalStepperApp);
      i18nFixture.detectChanges();
    });

    it('should re-render when the i18n labels change', () => {
      const intl = TestBed.inject(MatStepperIntl);
      const header = i18nFixture.debugElement.queryAll(By.css('mat-step-header'))[2].nativeElement;
      const optionalLabel = header.querySelector('.mat-step-optional');

      expect(optionalLabel).toBeTruthy();
      expect(optionalLabel.textContent).toBe('Optional');

      intl.optionalLabel = 'Valgfri';
      intl.changes.next();
      i18nFixture.detectChanges();

      expect(optionalLabel.textContent).toBe('Valgfri');
    });
  });

  describe('basic stepper with completed label change', () => {
    let fixture: ComponentFixture<SimpleMatHorizontalStepperApp>;

    beforeEach(() => {
      fixture = createComponent(SimpleMatHorizontalStepperApp);
      fixture.detectChanges();
    });

    it('should re-render when the completed labels change', () => {
      const intl = TestBed.inject(MatStepperIntl);
      const stepperElement = fixture.nativeElement.querySelector('mat-stepper');
      const stepper = fixture.componentInstance.stepper;

      stepper.steps.toArray()[0].editable = false;
      stepper.next();
      fixture.detectChanges();

      const header = stepperElement.querySelector('mat-step-header');
      const completedLabel = header.querySelector('.cdk-visually-hidden');

      expect(completedLabel).toBeTruthy();
      expect(completedLabel.textContent).toBe('Completed');

      intl.completedLabel = 'Completada';
      intl.changes.next();
      fixture.detectChanges();

      expect(completedLabel.textContent).toBe('Completada');
    });
  });

  describe('basic stepper with editable label change', () => {
    let fixture: ComponentFixture<SimpleMatHorizontalStepperApp>;

    beforeEach(() => {
      fixture = createComponent(SimpleMatHorizontalStepperApp);
      fixture.detectChanges();
      fixture.detectChanges();
    });

    it('should re-render when the editable label changes', () => {
      const intl = TestBed.inject(MatStepperIntl);
      const stepperElement = fixture.nativeElement.querySelector('mat-stepper');
      const stepper = fixture.componentInstance.stepper;

      stepper.steps.toArray()[0].editable = true;
      stepper.next();
      fixture.detectChanges();

      const header = stepperElement.querySelector('mat-step-header');
      const editableLabel = header.querySelector('.cdk-visually-hidden');

      expect(editableLabel).toBeTruthy();
      expect(editableLabel.textContent).toBe('Editable');

      intl.editableLabel = 'Modificabile';
      intl.changes.next();
      fixture.detectChanges();

      expect(editableLabel.textContent).toBe('Modificabile');
    });
  });

  describe('icon overrides', () => {
    let fixture: ComponentFixture<IconOverridesStepper>;

    beforeEach(() => {
      fixture = createComponent(IconOverridesStepper);
      fixture.detectChanges();
    });

    it('should allow for the `edit` icon to be overridden', () => {
      const stepperElement = fixture.nativeElement.querySelector('mat-stepper');
      const stepper = fixture.componentInstance.stepper;

      stepper.steps.toArray()[0].editable = true;
      stepper.next();
      fixture.detectChanges();

      const header = stepperElement.querySelector('mat-step-header');

      expect(header.textContent).toContain('Custom edit');
    });

    it('should allow for the `done` icon to be overridden', () => {
      const stepperElement = fixture.nativeElement.querySelector('mat-stepper');
      const stepper = fixture.componentInstance.stepper;

      stepper.steps.toArray()[0].editable = false;
      stepper.next();
      fixture.detectChanges();

      const header = stepperElement.querySelector('mat-step-header');

      expect(header.textContent).toContain('Custom done');
    });

    it('should allow for the `number` icon to be overridden with context', () => {
      const stepperElement = fixture.nativeElement.querySelector('mat-stepper');
      const headers = stepperElement.querySelectorAll('mat-step-header');

      expect(headers[2].textContent).toContain('III');
    });
  });

  describe('RTL', () => {
    let fixture: ComponentFixture<SimpleMatVerticalStepperApp>;

    beforeEach(() => {
      dir.set('rtl');
      fixture = createComponent(SimpleMatVerticalStepperApp);
      fixture.detectChanges();
    });

    it('should reverse animation in RTL mode', () => {
      const stepper = fixture.componentInstance.stepper;

      expect(stepper._getAnimationDirection(0)).toBe('current');
      expect(stepper._getAnimationDirection(1)).toBe('previous');
      expect(stepper._getAnimationDirection(2)).toBe('previous');

      stepper.selectedIndex = 1;
      fixture.detectChanges();

      expect(stepper._getAnimationDirection(0)).toBe('next');
      expect(stepper._getAnimationDirection(2)).toBe('previous');
      expect(stepper._getAnimationDirection(1)).toBe('current');

      stepper.selectedIndex = 2;
      fixture.detectChanges();

      expect(stepper._getAnimationDirection(0)).toBe('next');
      expect(stepper._getAnimationDirection(1)).toBe('next');
      expect(stepper._getAnimationDirection(2)).toBe('current');
    });
  });

  describe('linear stepper', () => {
    let fixture: ComponentFixture<LinearMatVerticalStepperApp>;
    let testComponent: LinearMatVerticalStepperApp;
    let stepper: MatStepper;

    beforeEach(() => {
      fixture = createComponent(LinearMatVerticalStepperApp);
      fixture.detectChanges();

      testComponent = fixture.componentInstance;
      stepper = fixture.debugElement.query(By.css('mat-stepper'))!.componentInstance;
    });

    it('should have true linear attribute', () => {
      expect(stepper.linear).toBe(true);
    });

    it('should not move to next step if current step is invalid', () => {
      expect(testComponent.oneGroup.get('oneCtrl')!.value).toBe('');
      expect(testComponent.oneGroup.get('oneCtrl')!.valid).toBe(false);
      expect(testComponent.oneGroup.valid).toBe(false);
      expect(testComponent.oneGroup.invalid).toBe(true);
      expect(stepper.selectedIndex).toBe(0);

      const stepHeaderEl = fixture.debugElement.queryAll(By.css('.mat-vertical-stepper-header'))[1]
        .nativeElement;

      stepHeaderEl.click();
      fixture.detectChanges();

      expect(stepper.selectedIndex).toBe(0);

      const nextButtonNativeEl = fixture.debugElement.queryAll(By.directive(MatStepperNext))[0]
        .nativeElement;
      nextButtonNativeEl.click();
      fixture.detectChanges();

      expect(stepper.selectedIndex).toBe(0);

      testComponent.oneGroup.get('oneCtrl')!.setValue('answer');
      stepHeaderEl.click();
      fixture.detectChanges();

      expect(testComponent.oneGroup.valid).toBe(true);
      expect(stepper.selectedIndex).toBe(1);
    });

    it('should not move to next step if current step is pending', () => {
      const stepHeaderEl = fixture.debugElement.queryAll(By.css('.mat-vertical-stepper-header'))[2]
        .nativeElement;

      const nextButtonNativeEl = fixture.debugElement.queryAll(By.directive(MatStepperNext))[1]
        .nativeElement;

      testComponent.oneGroup.get('oneCtrl')!.setValue('input');
      testComponent.twoGroup.get('twoCtrl')!.setValue('input');
      stepper.selectedIndex = 1;
      fixture.detectChanges();
      expect(stepper.selectedIndex).toBe(1);

      // Step status = PENDING
      // Assert that linear stepper does not allow step selection change
      expect(testComponent.twoGroup.pending).toBe(true);

      stepHeaderEl.click();
      fixture.detectChanges();

      expect(stepper.selectedIndex).toBe(1);

      nextButtonNativeEl.click();
      fixture.detectChanges();

      expect(stepper.selectedIndex).toBe(1);

      // Trigger asynchronous validation
      testComponent.validationTrigger.next();
      // Asynchronous validation completed:
      // Step status = VALID
      expect(testComponent.twoGroup.pending).toBe(false);
      expect(testComponent.twoGroup.valid).toBe(true);

      stepHeaderEl.click();
      fixture.detectChanges();

      expect(stepper.selectedIndex).toBe(2);

      stepper.selectedIndex = 1;
      fixture.detectChanges();
      expect(stepper.selectedIndex).toBe(1);

      nextButtonNativeEl.click();
      fixture.detectChanges();

      expect(stepper.selectedIndex).toBe(2);
    });

    it('should be able to focus step header upon click if it is unable to be selected', () => {
      const stepHeaderEl = fixture.debugElement.queryAll(By.css('mat-step-header'))[1]
        .nativeElement;

      fixture.detectChanges();

      expect(stepHeaderEl.getAttribute('tabindex')).toBe('-1');
    });

    it('should be able to move to next step even when invalid if current step is optional', () => {
      testComponent.oneGroup.get('oneCtrl')!.setValue('input');
      testComponent.twoGroup.get('twoCtrl')!.setValue('input');
      testComponent.validationTrigger.next();
      stepper.selectedIndex = 1;
      fixture.detectChanges();
      stepper.selectedIndex = 2;
      fixture.detectChanges();

      expect(stepper.steps.toArray()[2].optional).toBe(true);
      expect(stepper.selectedIndex).toBe(2);
      expect(testComponent.threeGroup.get('threeCtrl')!.valid).toBe(true);

      const nextButtonNativeEl = fixture.debugElement.queryAll(By.directive(MatStepperNext))[2]
        .nativeElement;
      nextButtonNativeEl.click();
      fixture.detectChanges();

      expect(stepper.selectedIndex)
        .withContext('Expected selectedIndex to change when optional step input is empty.')
        .toBe(3);

      stepper.selectedIndex = 2;
      testComponent.threeGroup.get('threeCtrl')!.setValue('input');
      nextButtonNativeEl.click();
      fixture.detectChanges();

      expect(testComponent.threeGroup.get('threeCtrl')!.valid).toBe(false);
      expect(stepper.selectedIndex)
        .withContext('Expected selectedIndex to change when optional step input is invalid.')
        .toBe(3);
    });

    it('should be able to reset the stepper to its initial state', () => {
      const steps = stepper.steps.toArray();

      testComponent.oneGroup.get('oneCtrl')!.setValue('value');
      fixture.detectChanges();

      stepper.next();
      fixture.detectChanges();

      stepper.next();
      fixture.detectChanges();

      expect(stepper.selectedIndex).toBe(1);
      expect(steps[0].interacted).toBe(true);
      expect(steps[0].completed).toBe(true);
      expect(testComponent.oneGroup.get('oneCtrl')!.valid).toBe(true);
      expect(testComponent.oneGroup.get('oneCtrl')!.value).toBe('value');

      expect(steps[1].interacted).toBe(true);
      expect(steps[1].completed).toBe(false);
      expect(testComponent.twoGroup.get('twoCtrl')!.valid).toBe(false);

      stepper.reset();
      fixture.detectChanges();

      expect(stepper.selectedIndex).toBe(0);
      expect(steps[0].interacted).toBe(false);
      expect(steps[0].completed).toBe(false);
      expect(testComponent.oneGroup.get('oneCtrl')!.valid).toBe(false);
      expect(testComponent.oneGroup.get('oneCtrl')!.value).toBeFalsy();

      expect(steps[1].interacted).toBe(false);
      expect(steps[1].completed).toBe(false);
      expect(testComponent.twoGroup.get('twoCtrl')!.valid).toBe(false);
    });

    it('should reset back to the first step when some of the steps are not editable', () => {
      const steps = stepper.steps.toArray();

      steps[0].editable = false;

      testComponent.oneGroup.get('oneCtrl')!.setValue('value');
      fixture.detectChanges();

      stepper.next();
      fixture.detectChanges();

      expect(stepper.selectedIndex).toBe(1);

      stepper.reset();
      fixture.detectChanges();

      expect(stepper.selectedIndex).toBe(0);
    });

    it('should not clobber the `complete` binding when resetting', () => {
      const steps: CdkStep[] = stepper.steps.toArray();
      const fillOutStepper = () => {
        testComponent.oneGroup.get('oneCtrl')!.setValue('input');
        testComponent.twoGroup.get('twoCtrl')!.setValue('input');
        testComponent.threeGroup.get('threeCtrl')!.setValue('valid');
        testComponent.validationTrigger.next();
        stepper.selectedIndex = 1;
        fixture.detectChanges();
        stepper.selectedIndex = 2;
        fixture.detectChanges();
        stepper.selectedIndex = 3;
        fixture.detectChanges();
      };

      fillOutStepper();

      expect(steps[2].completed)
        .withContext('Expected third step to be considered complete after the first run through.')
        .toBe(true);

      stepper.reset();
      fixture.detectChanges();
      fillOutStepper();

      expect(steps[2].completed)
        .withContext(
          'Expected third step to be considered complete when doing a run after ' + 'a reset.',
        )
        .toBe(true);
    });

    it('should be able to skip past the current step if a custom `completed` value is set', () => {
      expect(testComponent.oneGroup.get('oneCtrl')!.value).toBe('');
      expect(testComponent.oneGroup.get('oneCtrl')!.valid).toBe(false);
      expect(testComponent.oneGroup.valid).toBe(false);
      expect(stepper.selectedIndex).toBe(0);

      const nextButtonNativeEl = fixture.debugElement.queryAll(By.directive(MatStepperNext))[0]
        .nativeElement;
      nextButtonNativeEl.click();
      fixture.detectChanges();

      expect(stepper.selectedIndex).toBe(0);

      stepper.steps.first.completed = true;
      nextButtonNativeEl.click();
      fixture.detectChanges();

      expect(testComponent.oneGroup.valid).toBe(false);
      expect(stepper.selectedIndex).toBe(1);
    });

    it('should set aria-disabled if the user is not able to navigate to a step', () => {
      const stepHeaders = Array.from<HTMLElement>(
        fixture.nativeElement.querySelectorAll('.mat-vertical-stepper-header'),
      );

      expect(stepHeaders.map(step => step.getAttribute('aria-disabled'))).toEqual([
        null,
        'true',
        'true',
        'true',
      ]);
    });
  });

  describe('linear stepper with a pre-defined selectedIndex', () => {
    let preselectedFixture: ComponentFixture<SimplePreselectedMatHorizontalStepperApp>;
    let stepper: MatStepper;

    beforeEach(() => {
      preselectedFixture = createComponent(SimplePreselectedMatHorizontalStepperApp);
      preselectedFixture.detectChanges();
      stepper = preselectedFixture.componentInstance.stepper;
    });

    it('should not throw', () => {
      expect(() => preselectedFixture.detectChanges()).not.toThrow();
    });

    it('selectedIndex should be typeof number', () => {
      expect(typeof stepper.selectedIndex).toBe('number');
    });

    it('value of selectedIndex should be the pre-defined value', () => {
      expect(stepper.selectedIndex).toBe(0);
    });
  });

  describe('linear stepper with form already filled and on to the last step', () => {
    let fixture: ComponentFixture<LinearMatVerticalStepperAppForAlreadyFilledForm>;
    let stepper: MatStepper;

    beforeEach(() => {
      fixture = createComponent(LinearMatVerticalStepperAppForAlreadyFilledForm);
      fixture.detectChanges();
      stepper = fixture.componentInstance.stepper;
    });

    it('should navigate to previous steps', () => {
      expect(stepper.selectedIndex).toBe(2);

      stepper.previous();
      expect(stepper.selectedIndex).toBe(1);

      stepper.previous();
      expect(stepper.selectedIndex).toBe(0);
    });
  });

  describe('linear stepper with no `stepControl`', () => {
    let noStepControlFixture: ComponentFixture<SimpleStepperWithoutStepControl>;
    beforeEach(() => {
      noStepControlFixture = createComponent(SimpleStepperWithoutStepControl);
      noStepControlFixture.detectChanges();
    });
    it('should not move to the next step if the current one is not completed ', () => {
      const stepper = noStepControlFixture.componentInstance.stepper;

      const headers = noStepControlFixture.debugElement.queryAll(
        By.css('.mat-horizontal-stepper-header'),
      );

      expect(stepper.selectedIndex).toBe(0);

      headers[1].nativeElement.click();
      noStepControlFixture.detectChanges();

      expect(stepper.selectedIndex).toBe(0);
    });
  });

  describe('linear stepper with `stepControl`', () => {
    let controlAndBindingFixture: ComponentFixture<SimpleStepperWithStepControlAndCompletedBinding>;
    beforeEach(() => {
      controlAndBindingFixture = createComponent(SimpleStepperWithStepControlAndCompletedBinding);
      controlAndBindingFixture.detectChanges();
    });

    it('should have the `stepControl` take precedence when `completed` is set', () => {
      expect(controlAndBindingFixture.componentInstance.steps[0].control.valid).toBe(true);
      expect(controlAndBindingFixture.componentInstance.steps[0].completed).toBe(false);

      const stepper = controlAndBindingFixture.componentInstance.stepper;

      const headers = controlAndBindingFixture.debugElement.queryAll(
        By.css('.mat-horizontal-stepper-header'),
      );

      expect(stepper.selectedIndex).toBe(0);

      headers[1].nativeElement.click();
      controlAndBindingFixture.detectChanges();

      expect(stepper.selectedIndex).toBe(1);
    });
  });

  describe('vertical stepper', () => {
    it('should set the aria-orientation to "vertical"', () => {
      const fixture = createComponent(SimpleMatVerticalStepperApp);
      fixture.detectChanges();

      const stepperEl = fixture.debugElement.query(By.css('mat-stepper'))!.nativeElement;
      expect(stepperEl.getAttribute('aria-orientation')).toBe('vertical');
    });

    it('should support using the left/right arrows to move focus', () => {
      const fixture = createComponent(SimpleMatVerticalStepperApp);
      fixture.detectChanges();

      const stepHeaders = fixture.debugElement.queryAll(By.css('.mat-vertical-stepper-header'));
      assertCorrectKeyboardInteraction(fixture, stepHeaders, 'horizontal');
    });

    it('should support using the up/down arrows to move focus', () => {
      const fixture = createComponent(SimpleMatVerticalStepperApp);
      fixture.detectChanges();

      const stepHeaders = fixture.debugElement.queryAll(By.css('.mat-vertical-stepper-header'));
      assertCorrectKeyboardInteraction(fixture, stepHeaders, 'vertical');
    });

    it('should reverse arrow key focus in RTL mode', () => {
      dir.set('rtl');
      const fixture = createComponent(SimpleMatVerticalStepperApp);
      fixture.detectChanges();

      const stepHeaders = fixture.debugElement.queryAll(By.css('.mat-vertical-stepper-header'));
      assertArrowKeyInteractionInRtl(fixture, stepHeaders);
    });

    it('should be able to disable ripples', () => {
      const fixture = createComponent(SimpleMatVerticalStepperApp);
      fixture.detectChanges();

      const stepHeaders = fixture.debugElement.queryAll(By.directive(MatStepHeader));
      const headerRipples = stepHeaders.map(headerDebugEl =>
        headerDebugEl.query(By.directive(MatRipple))!.injector.get(MatRipple),
      );

      expect(headerRipples.every(ripple => ripple.disabled)).toBe(false);

      fixture.componentInstance.disableRipple.set(true);
      fixture.detectChanges();

      expect(headerRipples.every(ripple => ripple.disabled)).toBe(true);
    });

    it('should be able to disable ripples', () => {
      const fixture = createComponent(SimpleMatVerticalStepperApp);
      fixture.detectChanges();

      const stepHeaders = fixture.debugElement.queryAll(By.directive(MatStepHeader));

      stepHeaders[0].componentInstance.focus('mouse');
      stepHeaders[1].componentInstance.focus();

      expect(stepHeaders[1].nativeElement.classList).toContain('cdk-focused');
      expect(stepHeaders[1].nativeElement.classList).toContain('cdk-mouse-focused');
    });

    it('should be able to set the theme for all steps', () => {
      const fixture = createComponent(SimpleMatVerticalStepperApp);
      fixture.detectChanges();

      const headers = Array.from<HTMLElement>(
        fixture.nativeElement.querySelectorAll('.mat-step-header'),
      );

      expect(headers.every(element => element.classList.contains('mat-primary'))).toBe(true);
      expect(headers.some(element => element.classList.contains('mat-accent'))).toBe(false);
      expect(headers.some(element => element.classList.contains('mat-warn'))).toBe(false);

      fixture.componentInstance.stepperTheme.set('accent');
      fixture.detectChanges();

      expect(headers.some(element => element.classList.contains('mat-accent'))).toBe(true);
      expect(headers.some(element => element.classList.contains('mat-primary'))).toBe(false);
      expect(headers.some(element => element.classList.contains('mat-warn'))).toBe(false);
    });

    it('should be able to set the theme for a specific step', () => {
      const fixture = createComponent(SimpleMatVerticalStepperApp);
      fixture.detectChanges();

      const headers = Array.from<HTMLElement>(
        fixture.nativeElement.querySelectorAll('.mat-step-header'),
      );

      expect(headers.every(element => element.classList.contains('mat-primary'))).toBe(true);

      fixture.componentInstance.secondStepTheme.set('accent');
      fixture.detectChanges();

      expect(headers[0].classList.contains('mat-primary')).toBe(true);
      expect(headers[1].classList.contains('mat-primary')).toBe(false);
      expect(headers[2].classList.contains('mat-primary')).toBe(true);
      expect(headers[1].classList.contains('mat-accent')).toBe(true);
    });
  });

  describe('horizontal stepper', () => {
    it('should set the aria-orientation to "horizontal"', () => {
      const fixture = createComponent(SimpleMatHorizontalStepperApp);
      fixture.detectChanges();

      const stepperEl = fixture.debugElement.query(By.css('mat-stepper'))!.nativeElement;
      expect(stepperEl.getAttribute('aria-orientation')).toBe('horizontal');
    });

    it('should support using the left/right arrows to move focus', () => {
      const fixture = createComponent(SimpleMatHorizontalStepperApp);
      fixture.detectChanges();

      const stepHeaders = fixture.debugElement.queryAll(By.css('.mat-horizontal-stepper-header'));
      assertCorrectKeyboardInteraction(fixture, stepHeaders, 'horizontal');
    });

    it('should reverse arrow key focus in RTL mode', () => {
      dir.set('rtl');
      const fixture = createComponent(SimpleMatHorizontalStepperApp);
      fixture.detectChanges();

      const stepHeaders = fixture.debugElement.queryAll(By.css('.mat-horizontal-stepper-header'));
      assertArrowKeyInteractionInRtl(fixture, stepHeaders);
    });

    it('should maintain the correct navigation order when a step is added later on', () => {
      const fixture = createComponent(HorizontalStepperWithDelayedStep);
      fixture.detectChanges();
      fixture.componentInstance.renderSecondStep.set(true);
      fixture.detectChanges();

      const stepHeaders = fixture.debugElement.queryAll(By.css('.mat-horizontal-stepper-header'));
      assertCorrectKeyboardInteraction(fixture, stepHeaders, 'horizontal');
    });

    it('should reverse arrow key focus when switching into RTL after init', () => {
      const fixture = createComponent(SimpleMatHorizontalStepperApp);
      fixture.detectChanges();

      const stepHeaders = fixture.debugElement.queryAll(By.css('.mat-horizontal-stepper-header'));
      assertCorrectKeyboardInteraction(fixture, stepHeaders, 'horizontal');

      dir.set('rtl');
      fixture.detectChanges();

      assertArrowKeyInteractionInRtl(fixture, stepHeaders);
    });

    it('should be able to disable ripples', () => {
      const fixture = createComponent(SimpleMatHorizontalStepperApp);
      fixture.detectChanges();

      const stepHeaders = fixture.debugElement.queryAll(By.directive(MatStepHeader));
      const headerRipples = stepHeaders.map(headerDebugEl =>
        headerDebugEl.query(By.directive(MatRipple))!.injector.get(MatRipple),
      );

      expect(headerRipples.every(ripple => ripple.disabled)).toBe(false);

      fixture.componentInstance.disableRipple.set(true);
      fixture.detectChanges();

      expect(headerRipples.every(ripple => ripple.disabled)).toBe(true);
    });

    it('should be able to set the theme for all steps', () => {
      const fixture = createComponent(SimpleMatHorizontalStepperApp);
      fixture.detectChanges();

      const headers = Array.from<HTMLElement>(
        fixture.nativeElement.querySelectorAll('.mat-step-header'),
      );

      expect(headers.every(element => element.classList.contains('mat-primary'))).toBe(true);
      expect(headers.some(element => element.classList.contains('mat-accent'))).toBe(false);
      expect(headers.some(element => element.classList.contains('mat-warn'))).toBe(false);

      fixture.componentInstance.stepperTheme.set('accent');
      fixture.detectChanges();

      expect(headers.some(element => element.classList.contains('mat-accent'))).toBe(true);
      expect(headers.some(element => element.classList.contains('mat-primary'))).toBe(false);
      expect(headers.some(element => element.classList.contains('mat-warn'))).toBe(false);
    });

    it('should be able to set the theme for a specific step', () => {
      const fixture = createComponent(SimpleMatHorizontalStepperApp);
      fixture.detectChanges();

      const headers = Array.from<HTMLElement>(
        fixture.nativeElement.querySelectorAll('.mat-step-header'),
      );

      expect(headers.every(element => element.classList.contains('mat-primary'))).toBe(true);

      fixture.componentInstance.secondStepTheme.set('accent');
      fixture.detectChanges();

      expect(headers[0].classList.contains('mat-primary')).toBe(true);
      expect(headers[1].classList.contains('mat-primary')).toBe(false);
      expect(headers[2].classList.contains('mat-primary')).toBe(true);
      expect(headers[1].classList.contains('mat-accent')).toBe(true);
    });

    it('should be able to mark all steps as interacted', () => {
      const fixture = createComponent(SimpleMatHorizontalStepperApp);
      fixture.detectChanges();

      const stepper = fixture.componentInstance.stepper;

      expect(stepper.steps.map(step => step.interacted)).toEqual([false, false, false]);

      stepper.next();
      fixture.detectChanges();
      expect(stepper.steps.map(step => step.interacted)).toEqual([true, false, false]);

      stepper.next();
      fixture.detectChanges();
      expect(stepper.steps.map(step => step.interacted)).toEqual([true, true, false]);

      stepper.previous();
      fixture.detectChanges();
      expect(stepper.steps.map(step => step.interacted)).toEqual([true, true, true]);
    });

    it('should emit when the user has interacted with a step', () => {
      const fixture = createComponent(SimpleMatHorizontalStepperApp);
      fixture.detectChanges();

      const stepper = fixture.componentInstance.stepper;
      const interactedSteps: number[] = [];
      const subscription = merge(...stepper.steps.map(step => step.interactedStream)).subscribe(
        step => interactedSteps.push(stepper.steps.toArray().indexOf(step as MatStep)),
      );

      expect(interactedSteps).toEqual([]);

      stepper.next();
      fixture.detectChanges();
      expect(interactedSteps).toEqual([0]);

      stepper.next();
      fixture.detectChanges();
      expect(interactedSteps).toEqual([0, 1]);

      stepper.previous();
      fixture.detectChanges();
      expect(interactedSteps).toEqual([0, 1, 2]);
      subscription.unsubscribe();
    });

    it('should not emit interacted event if selectedIndex does not change', () => {
      const fixture = createComponent(SimpleMatHorizontalStepperApp);
      fixture.detectChanges();

      const stepper = fixture.componentInstance.stepper;
      const interactedSteps: number[] = [];
      const subscription = merge(...stepper.steps.map(step => step.interactedStream)).subscribe(
        step => interactedSteps.push(stepper.steps.toArray().indexOf(step as MatStep)),
      );

      expect(interactedSteps).toEqual([]);

      stepper.next();
      fixture.detectChanges();
      expect(interactedSteps).toEqual([0]);

      stepper.selectedIndex = 1;
      fixture.detectChanges();
      expect(interactedSteps).toEqual([0]);
      subscription.unsubscribe();
    });

    it('should set a class on the host if the header is positioned at the bottom', () => {
      const fixture = createComponent(SimpleMatHorizontalStepperApp);
      fixture.detectChanges();
      const stepperHost = fixture.nativeElement.querySelector('.mat-stepper-horizontal');

      expect(stepperHost.classList).not.toContain('mat-stepper-header-position-bottom');

      fixture.componentInstance.headerPosition.set('bottom');
      fixture.detectChanges();

      expect(stepperHost.classList).toContain('mat-stepper-header-position-bottom');
    });
  });

  describe('linear stepper with valid step', () => {
    let fixture: ComponentFixture<LinearStepperWithValidOptionalStep>;
    let testComponent: LinearStepperWithValidOptionalStep;
    let stepper: MatStepper;

    beforeEach(() => {
      fixture = createComponent(LinearStepperWithValidOptionalStep);
      fixture.detectChanges();

      testComponent = fixture.componentInstance;
      stepper = fixture.debugElement.query(By.css('mat-stepper'))!.componentInstance;
    });

    it('must be visited if not optional', () => {
      stepper.selectedIndex = 1;
      fixture.componentRef.changeDetectorRef.markForCheck();
      fixture.detectChanges();
      expect(stepper.selectedIndex).toBe(1);

      stepper.selectedIndex = 2;
      fixture.componentRef.changeDetectorRef.markForCheck();
      fixture.detectChanges();
      expect(stepper.selectedIndex).toBe(2);
    });

    it('can be skipped entirely if optional', () => {
      testComponent.step2Optional.set(true);
      fixture.detectChanges();
      stepper.selectedIndex = 2;
      fixture.detectChanges();
      expect(stepper.selectedIndex).toBe(2);
    });
  });

  describe('aria labelling', () => {
    let fixture: ComponentFixture<StepperWithAriaInputs>;
    let stepHeader: HTMLElement;

    beforeEach(() => {
      fixture = createComponent(StepperWithAriaInputs);
      fixture.detectChanges();
      stepHeader = fixture.nativeElement.querySelector('.mat-step-header');
    });

    it('should not set aria-label or aria-labelledby attributes if they are not passed in', () => {
      expect(stepHeader.hasAttribute('aria-label')).toBe(false);
      expect(stepHeader.hasAttribute('aria-labelledby')).toBe(false);
    });

    it('should set the aria-label attribute', () => {
      fixture.componentInstance.ariaLabel.set('First step');
      fixture.detectChanges();

      expect(stepHeader.getAttribute('aria-label')).toBe('First step');
    });

    it('should set the aria-labelledby attribute', () => {
      fixture.componentInstance.ariaLabelledby.set('first-step-label');
      fixture.detectChanges();

      expect(stepHeader.getAttribute('aria-labelledby')).toBe('first-step-label');
    });

    it('should not be able to set both an aria-label and aria-labelledby', () => {
      fixture.componentInstance.ariaLabel.set('First step');
      fixture.componentInstance.ariaLabelledby.set('first-step-label');
      fixture.detectChanges();

      expect(stepHeader.getAttribute('aria-label')).toBe('First step');
      expect(stepHeader.hasAttribute('aria-labelledby')).toBe(false);
    });
  });

  describe('stepper with error state', () => {
    let fixture: ComponentFixture<MatHorizontalStepperWithErrorsApp>;
    let stepper: MatStepper;

    function createFixture(showErrorByDefault: boolean | undefined) {
      fixture = createComponent(MatHorizontalStepperWithErrorsApp, [
        {
          provide: STEPPER_GLOBAL_OPTIONS,
          useValue: {showError: showErrorByDefault},
        },
      ]);
      fixture.detectChanges();
      stepper = fixture.debugElement.query(By.css('mat-stepper'))!.componentInstance;
    }

    it('should show error state', () => {
      createFixture(true);
      const nextButtonNativeEl = fixture.debugElement.queryAll(By.directive(MatStepperNext))[0]
        .nativeElement;

      stepper.selectedIndex = 1;
      stepper.steps.first.hasError = true;
      nextButtonNativeEl.click();
      fixture.detectChanges();

      expect(stepper.steps.first.indicatorType()).toBe(STEP_STATE.ERROR);
    });

    it('should respect a custom falsy hasError value', () => {
      createFixture(true);
      const nextButtonNativeEl = fixture.debugElement.queryAll(By.directive(MatStepperNext))[0]
        .nativeElement;

      stepper.selectedIndex = 1;
      nextButtonNativeEl.click();
      fixture.detectChanges();

      expect(stepper.steps.first.indicatorType()).toBe(STEP_STATE.ERROR);

      stepper.steps.first.hasError = false;
      fixture.detectChanges();

      expect(stepper.steps.first.indicatorType()).not.toBe(STEP_STATE.ERROR);
    });

    it('should show error state if explicitly enabled, even when disabled globally', () => {
      createFixture(undefined);
      const nextButtonNativeEl = fixture.debugElement.queryAll(By.directive(MatStepperNext))[0]
        .nativeElement;

      stepper.selectedIndex = 1;
      stepper.steps.first.hasError = true;
      nextButtonNativeEl.click();
      fixture.detectChanges();

      expect(stepper.steps.first.indicatorType()).toBe(STEP_STATE.ERROR);
    });
  });

  describe('stepper using Material UI Guideline logic', () => {
    let fixture: ComponentFixture<MatHorizontalStepperWithErrorsApp>;
    let stepper: MatStepper;

    beforeEach(() => {
      fixture = createComponent(MatHorizontalStepperWithErrorsApp, [
        {
          provide: STEPPER_GLOBAL_OPTIONS,
          useValue: {displayDefaultIndicatorType: false},
        },
      ]);
      fixture.detectChanges();
      stepper = fixture.debugElement.query(By.css('mat-stepper'))!.componentInstance;
    });

    it('should show done state when step is completed and its not the current step', () => {
      const nextButtonNativeEl = fixture.debugElement.queryAll(By.directive(MatStepperNext))[0]
        .nativeElement;

      stepper.selectedIndex = 1;
      stepper.steps.first.completed = true;
      nextButtonNativeEl.click();
      fixture.detectChanges();

      expect(stepper.steps.first.indicatorType()).toBe(STEP_STATE.DONE);
    });

    it('should show edit state when step is editable and its the current step', () => {
      stepper.selectedIndex = 1;
      stepper.steps.toArray()[1].editable = true;
      fixture.detectChanges();

      expect(stepper.steps.get(1)!.indicatorType()).toBe(STEP_STATE.EDIT);
    });
  });

  describe('indirect descendants', () => {
    it('should be able to change steps when steps are indirect descendants', () => {
      const fixture = createComponent(StepperWithIndirectDescendantSteps);
      fixture.detectChanges();

      const stepHeaders = fixture.debugElement.queryAll(By.css('.mat-vertical-stepper-header'));
      const stepper = fixture.componentInstance.stepper;

      expect(stepper.selectedIndex).toBe(0);
      expect(stepper.selected instanceof MatStep).toBe(true);

      // select the second step
      let stepHeaderEl = stepHeaders[1].nativeElement;
      stepHeaderEl.click();
      fixture.detectChanges();

      expect(stepper.selectedIndex).toBe(1);
      expect(stepper.selected instanceof MatStep).toBe(true);

      // select the third step
      stepHeaderEl = stepHeaders[2].nativeElement;
      stepHeaderEl.click();
      fixture.detectChanges();

      expect(stepper.selectedIndex).toBe(2);
      expect(stepper.selected instanceof MatStep).toBe(true);
    });

    it('should allow for the `edit` icon to be overridden', () => {
      const fixture = createComponent(IndirectDescendantIconOverridesStepper);
      fixture.detectChanges();

      const stepperElement = fixture.nativeElement.querySelector('mat-stepper');
      const stepper = fixture.componentInstance.stepper;

      stepper.steps.toArray()[0].editable = true;
      stepper.next();
      fixture.detectChanges();

      const header = stepperElement.querySelector('mat-step-header');

      expect(header.textContent).toContain('Custom edit');
    });

    it('should allow for the `done` icon to be overridden', () => {
      const fixture = createComponent(IndirectDescendantIconOverridesStepper);
      fixture.detectChanges();

      const stepperElement = fixture.nativeElement.querySelector('mat-stepper');
      const stepper = fixture.componentInstance.stepper;

      stepper.steps.toArray()[0].editable = false;
      stepper.next();
      fixture.detectChanges();

      const header = stepperElement.querySelector('mat-step-header');

      expect(header.textContent).toContain('Custom done');
    });

    it('should allow for the `number` icon to be overridden with context', () => {
      const fixture = createComponent(IndirectDescendantIconOverridesStepper);
      fixture.detectChanges();

      const stepperElement = fixture.nativeElement.querySelector('mat-stepper');
      const headers = stepperElement.querySelectorAll('mat-step-header');

      expect(headers[2].textContent).toContain('III');
    });
  });

  it('should be able to toggle steps via ngIf', () => {
    const fixture = createComponent(StepperWithNgIf);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.mat-step-header').length).toBe(1);

    fixture.componentInstance.showStep2.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.mat-step-header').length).toBe(2);
  });

  it('should not pick up the steps from descendant steppers', () => {
    const fixture = createComponent(NestedSteppers);
    fixture.detectChanges();
    const steppers = fixture.componentInstance.steppers.toArray();

    expect(steppers[0].steps.length).toBe(3);
    expect(steppers[1].steps.length).toBe(2);
  });

  it('should not throw when trying to change steps after initializing to an out-of-bounds index', () => {
    const fixture = createComponent(StepperWithStaticOutOfBoundsIndex);
    fixture.detectChanges();
    const stepper = fixture.componentInstance.stepper;

    expect(stepper.selectedIndex).toBe(0);
    expect(stepper.selected).toBeTruthy();

    expect(() => {
      stepper.selectedIndex = 1;
      fixture.detectChanges();
    }).not.toThrow();

    expect(stepper.selectedIndex).toBe(1);
    expect(stepper.selected).toBeTruthy();
  });

  describe('stepper with lazy content', () => {
    it('should render the content of the selected step on init', () => {
      const fixture = createComponent(StepperWithLazyContent);
      const element = fixture.nativeElement;
      fixture.componentInstance.selectedIndex.set(1);
      fixture.detectChanges();

      expect(element.textContent).not.toContain('Step 1 content');
      expect(element.textContent).toContain('Step 2 content');
      expect(element.textContent).not.toContain('Step 3 content');
    });

    it('should render the content of steps when the user navigates to them', () => {
      const fixture = createComponent(StepperWithLazyContent);
      const element = fixture.nativeElement;
      fixture.componentInstance.selectedIndex.set(0);
      fixture.detectChanges();

      expect(element.textContent).toContain('Step 1 content');
      expect(element.textContent).not.toContain('Step 2 content');
      expect(element.textContent).not.toContain('Step 3 content');

      fixture.componentInstance.selectedIndex.set(1);
      fixture.detectChanges();

      expect(element.textContent).toContain('Step 1 content');
      expect(element.textContent).toContain('Step 2 content');
      expect(element.textContent).not.toContain('Step 3 content');

      fixture.componentInstance.selectedIndex.set(2);
      fixture.detectChanges();

      expect(element.textContent).toContain('Step 1 content');
      expect(element.textContent).toContain('Step 2 content');
      expect(element.textContent).toContain('Step 3 content');
    });
  });

  describe('stepper with two-way binding on selectedIndex', () => {
    it('should update selectedIndex in component on navigation', () => {
      const fixture = createComponent(StepperWithTwoWayBindingOnSelectedIndex);
      fixture.detectChanges();

      expect(fixture.componentInstance.index).toBe(0);

      const stepHeaders = fixture.debugElement.queryAll(By.css('.mat-horizontal-stepper-header'));

      let lastStepHeaderEl = stepHeaders[2].nativeElement;
      lastStepHeaderEl.click();
      fixture.detectChanges();

      expect(fixture.componentInstance.index).toBe(2);

      let middleStepHeaderEl = stepHeaders[1].nativeElement;
      middleStepHeaderEl.click();
      fixture.detectChanges();

      expect(fixture.componentInstance.index).toBe(1);

      let firstStepHeaderEl = stepHeaders[0].nativeElement;
      firstStepHeaderEl.click();
      fixture.detectChanges();

      expect(fixture.componentInstance.index).toBe(0);
    });
  });
});

/** Asserts that keyboard interaction works correctly. */
function assertCorrectKeyboardInteraction(
  fixture: ComponentFixture<{stepper: MatStepper}>,
  stepHeaders: DebugElement[],
  orientation: StepperOrientation,
) {
  const stepper = fixture.componentInstance.stepper;
  const nextKey = orientation === 'vertical' ? DOWN_ARROW : RIGHT_ARROW;
  const prevKey = orientation === 'vertical' ? UP_ARROW : LEFT_ARROW;

  expect(stepper._getFocusIndex()).toBe(0);
  expect(stepper.selectedIndex).toBe(0);

  let stepHeaderEl = stepHeaders[0].nativeElement;
  dispatchKeyboardEvent(stepHeaderEl, 'keydown', nextKey);
  fixture.detectChanges();

  expect(stepper._getFocusIndex())
    .withContext('Expected index of focused step to increase by 1 after pressing the next key.')
    .toBe(1);
  expect(stepper.selectedIndex)
    .withContext('Expected index of selected step to remain unchanged after pressing the next key.')
    .toBe(0);

  stepHeaderEl = stepHeaders[1].nativeElement;
  dispatchKeyboardEvent(stepHeaderEl, 'keydown', ENTER);
  fixture.detectChanges();

  expect(stepper._getFocusIndex())
    .withContext('Expected index of focused step to remain unchanged after ENTER event.')
    .toBe(1);
  expect(stepper.selectedIndex)
    .withContext(
      'Expected index of selected step to change to index of focused step ' + 'after ENTER event.',
    )
    .toBe(1);

  stepHeaderEl = stepHeaders[1].nativeElement;
  dispatchKeyboardEvent(stepHeaderEl, 'keydown', prevKey);
  fixture.detectChanges();

  expect(stepper._getFocusIndex())
    .withContext(
      'Expected index of focused step to decrease by 1 after pressing the ' + 'previous key.',
    )
    .toBe(0);
  expect(stepper.selectedIndex)
    .withContext(
      'Expected index of selected step to remain unchanged after pressing the ' + 'previous key.',
    )
    .toBe(1);

  // When the focus is on the last step and right arrow key is pressed, the focus should cycle
  // through to the first step.
  (stepper as any)._keyManager.updateActiveItem(2);
  stepHeaderEl = stepHeaders[2].nativeElement;
  dispatchKeyboardEvent(stepHeaderEl, 'keydown', nextKey);
  fixture.detectChanges();

  expect(stepper._getFocusIndex())
    .withContext(
      'Expected index of focused step to cycle through to index 0 after pressing ' +
        'the next key.',
    )
    .toBe(0);
  expect(stepper.selectedIndex)
    .withContext(
      'Expected index of selected step to remain unchanged after pressing ' + 'the next key.',
    )
    .toBe(1);

  stepHeaderEl = stepHeaders[0].nativeElement;
  dispatchKeyboardEvent(stepHeaderEl, 'keydown', SPACE);
  fixture.detectChanges();

  expect(stepper._getFocusIndex())
    .withContext('Expected index of focused to remain unchanged after SPACE event.')
    .toBe(0);
  expect(stepper.selectedIndex)
    .withContext(
      'Expected index of selected step to change to index of focused step ' + 'after SPACE event.',
    )
    .toBe(0);

  const endEvent = dispatchKeyboardEvent(stepHeaderEl, 'keydown', END);
  expect(stepper._getFocusIndex())
    .withContext('Expected last step to be focused when pressing END.')
    .toBe(stepHeaders.length - 1);
  expect(endEvent.defaultPrevented)
    .withContext('Expected default END action to be prevented.')
    .toBe(true);

  const homeEvent = dispatchKeyboardEvent(stepHeaderEl, 'keydown', HOME);
  expect(stepper._getFocusIndex())
    .withContext('Expected first step to be focused when pressing HOME.')
    .toBe(0);
  expect(homeEvent.defaultPrevented)
    .withContext('Expected default HOME action to be prevented.')
    .toBe(true);
}

/** Asserts that arrow key direction works correctly in RTL mode. */
function assertArrowKeyInteractionInRtl(
  fixture: ComponentFixture<{stepper: MatStepper}>,
  stepHeaders: DebugElement[],
) {
  const stepper = fixture.componentInstance.stepper;
  expect(stepper._getFocusIndex()).toBe(0);

  let stepHeaderEl = stepHeaders[0].nativeElement;
  dispatchKeyboardEvent(stepHeaderEl, 'keydown', LEFT_ARROW);
  fixture.detectChanges();

  expect(stepper._getFocusIndex()).toBe(1);

  stepHeaderEl = stepHeaders[1].nativeElement;
  dispatchKeyboardEvent(stepHeaderEl, 'keydown', RIGHT_ARROW);
  fixture.detectChanges();

  expect(stepper._getFocusIndex()).toBe(0);
}

/** Asserts that keyboard interaction works correctly when the user is pressing a modifier key. */
function assertSelectKeyWithModifierInteraction(
  fixture: ComponentFixture<{stepper: MatStepper}>,
  stepHeaders: DebugElement[],
  orientation: StepperOrientation,
  selectionKey: number,
) {
  const stepper = fixture.componentInstance.stepper;
  const modifiers = ['altKey', 'shiftKey', 'ctrlKey', 'metaKey'];

  expect(stepper._getFocusIndex()).toBe(0);
  expect(stepper.selectedIndex).toBe(0);

  dispatchKeyboardEvent(
    stepHeaders[0].nativeElement,
    'keydown',
    orientation === 'vertical' ? DOWN_ARROW : RIGHT_ARROW,
  );
  fixture.detectChanges();

  expect(stepper._getFocusIndex())
    .withContext(
      'Expected index of focused step to increase by 1 after pressing ' + 'the next key.',
    )
    .toBe(1);
  expect(stepper.selectedIndex)
    .withContext(
      'Expected index of selected step to remain unchanged after pressing ' + 'the next key.',
    )
    .toBe(0);

  modifiers.forEach(modifier => {
    const event = createKeyboardEvent('keydown', selectionKey);
    Object.defineProperty(event, modifier, {get: () => true});
    dispatchEvent(stepHeaders[1].nativeElement, event);
    fixture.detectChanges();

    expect(stepper.selectedIndex)
      .withContext(
        `Expected selected index to remain unchanged ` +
          `when pressing the selection key with ${modifier} modifier.`,
      )
      .toBe(0);
    expect(event.defaultPrevented).toBe(false);
  });
}

function asyncValidator(minLength: number, validationTrigger: Subject<void>): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    return validationTrigger.pipe(
      map(() =>
        control.value && control.value.length >= minLength ? null : {asyncValidation: {}},
      ),
      take(1),
    );
  };
}

function createComponent<T>(
  component: Type<T>,
  providers: Provider[] = [],
  encapsulation?: ViewEncapsulation,
): ComponentFixture<T> {
  TestBed.configureTestingModule({
    providers: [
      provideFakeDirectionality(dir),
      {provide: MATERIAL_ANIMATIONS, useValue: {animationsDisabled: true}},
      ...providers,
    ],
  });

  if (encapsulation != null) {
    TestBed.overrideComponent(component, {
      set: {encapsulation},
    });
  }

  return TestBed.createComponent<T>(component);
}

@Component({
  template: `
  <form [formGroup]="formGroup">
    <mat-stepper>
      <mat-step errorMessage="This field is required"
        [stepControl]="formGroup.get('firstNameCtrl')">
        <ng-template matStepLabel>Step 1</ng-template>
        <mat-form-field>
          <mat-label>First name</mat-label>
          <input matInput formControlName="firstNameCtrl" required>
          <mat-error>This field is required</mat-error>
        </mat-form-field>
        <div>
          <button matStepperPrevious>Back</button>
          <button matStepperNext>Next</button>
        </div>
      </mat-step>
      <mat-step>
        <ng-template matStepLabel>Step 2</ng-template>
        Content 2
        <div>
          <button matStepperPrevious>Back</button>
          <button matStepperNext>Next</button>
        </div>
      </mat-step>
    </mat-stepper>
  </form>
  `,
  imports: [MatStepperModule, MatInputModule, ReactiveFormsModule],
})
class MatHorizontalStepperWithErrorsApp {
  private readonly _formBuilder = inject(FormBuilder);

  formGroup = this._formBuilder.group({
    firstNameCtrl: ['', Validators.required],
    lastNameCtrl: ['', Validators.required],
  });
}

@Component({
  template: `
    <mat-stepper
      [disableRipple]="disableRipple()"
      [color]="stepperTheme()"
      [headerPosition]="headerPosition()">
      <mat-step>
        <ng-template matStepLabel>Step 1</ng-template>
        Content 1
        <div>
          <button matStepperPrevious>Back</button>
          <button matStepperNext>Next</button>
        </div>
      </mat-step>
      <mat-step [color]="secondStepTheme()">
        <ng-template matStepLabel>Step 2</ng-template>
        Content 2
        <div>
          <button matStepperPrevious>Back</button>
          <button matStepperNext>Next</button>
        </div>
      </mat-step>
      <mat-step [label]="inputLabel" optional>
        Content 3
        <div>
          <button matStepperPrevious>Back</button>
          <button matStepperNext>Next</button>
        </div>
      </mat-step>
    </mat-stepper>
  `,
  imports: [MatStepperModule],
})
class SimpleMatHorizontalStepperApp {
  @ViewChild(MatStepper) stepper: MatStepper;
  inputLabel = 'Step 3';
  disableRipple = signal(false);
  stepperTheme = signal<ThemePalette>(undefined);
  secondStepTheme = signal<ThemePalette>(undefined);
  headerPosition = signal('');
}

@Component({
  template: `
    <mat-stepper orientation="vertical" [disableRipple]="disableRipple()" [color]="stepperTheme()">
      <mat-step>
        <ng-template matStepLabel>Step 1</ng-template>
        Content 1
        <div>
          <button matStepperPrevious>Back</button>
          <button matStepperNext>Next</button>
        </div>
      </mat-step>
      @if (showStepTwo()) {
        <mat-step [color]="secondStepTheme()">
          <ng-template matStepLabel>Step 2</ng-template>
          Content 2
          <div>
            <button matStepperPrevious>Back</button>
            <button matStepperNext>Next</button>
          </div>
        </mat-step>
      }
      <mat-step [label]="inputLabel()">
        Content 3
        <div>
          <button matStepperPrevious>Back</button>
          <button matStepperNext>Next</button>
        </div>
      </mat-step>
    </mat-stepper>
  `,
  imports: [MatStepperModule],
})
class SimpleMatVerticalStepperApp {
  @ViewChild(MatStepper) stepper: MatStepper;
  inputLabel = signal('Step 3');
  showStepTwo = signal(true);
  disableRipple = signal(false);
  stepperTheme = signal<ThemePalette>(undefined);
  secondStepTheme = signal<ThemePalette>(undefined);
}

@Component({
  template: `
    <mat-stepper orientation="vertical" linear>
      <mat-step [stepControl]="oneGroup">
        <form [formGroup]="oneGroup">
          <ng-template matStepLabel>Step one</ng-template>
          <input formControlName="oneCtrl" required>
          <div>
            <button matStepperPrevious>Back</button>
            <button matStepperNext>Next</button>
          </div>
        </form>
      </mat-step>
      <mat-step [stepControl]="twoGroup">
        <form [formGroup]="twoGroup">
          <ng-template matStepLabel>Step two</ng-template>
          <input formControlName="twoCtrl" required>
          <div>
            <button matStepperPrevious>Back</button>
            <button matStepperNext>Next</button>
          </div>
        </form>
      </mat-step>
      <mat-step [stepControl]="threeGroup" optional>
        <form [formGroup]="threeGroup">
          <ng-template matStepLabel>Step two</ng-template>
          <input formControlName="threeCtrl">
          <div>
            <button matStepperPrevious>Back</button>
            <button matStepperNext>Next</button>
          </div>
        </form>
      </mat-step>
      <mat-step>
        Done
      </mat-step>
    </mat-stepper>
  `,
  imports: [ReactiveFormsModule, MatStepperModule],
})
class LinearMatVerticalStepperApp {
  validationTrigger = new Subject<void>();
  oneGroup = new FormGroup({
    oneCtrl: new FormControl('', Validators.required),
  });
  twoGroup = new FormGroup({
    twoCtrl: new FormControl('', Validators.required, asyncValidator(3, this.validationTrigger)),
  });
  threeGroup = new FormGroup({
    threeCtrl: new FormControl('', Validators.pattern(VALID_REGEX)),
  });
}

@Component({
  template: `
    <mat-stepper [linear]="true" [selectedIndex]="index">
      <mat-step label="One"></mat-step>
      <mat-step label="Two"></mat-step>
      <mat-step label="Three"></mat-step>
    </mat-stepper>
  `,
  imports: [MatStepperModule],
})
class SimplePreselectedMatHorizontalStepperApp {
  @ViewChild(MatStepper) stepper: MatStepper;
  index = 0;
}

@Component({
  template: `
    <mat-stepper linear [selectedIndex]="selectedIndex()">
      <mat-step [stepControl]="oneGroup">
        <form [formGroup]="oneGroup">
          <ng-template matStepLabel>Step one</ng-template>
          <input formControlName="oneCtrl" required>
          <div>
            <button matStepperPrevious>Back</button>
            <button matStepperNext>Next</button>
          </div>
        </form>
      </mat-step>
      <mat-step [stepControl]="twoGroup">
        <form [formGroup]="twoGroup">
          <ng-template matStepLabel>Step two</ng-template>
          <input formControlName="twoCtrl" required>
          <div>
            <button matStepperPrevious>Back</button>
            <button matStepperNext>Next</button>
          </div>
        </form>
      </mat-step>
      <mat-step [stepControl]="threeGroup" optional>
        <form [formGroup]="threeGroup">
          <ng-template matStepLabel>Step two</ng-template>
          <input formControlName="threeCtrl">
          <div>
            <button matStepperPrevious>Back</button>
            <button matStepperNext>Next</button>
          </div>
        </form>
      </mat-step>
      <mat-step>
        Done
      </mat-step>
    </mat-stepper>
  `,
  imports: [ReactiveFormsModule, MatStepperModule],
})
class LinearMatVerticalStepperAppForAlreadyFilledForm {
  @ViewChild(MatStepper) stepper: MatStepper;
  selectedIndex = signal(2);

  oneGroup = new FormGroup({
    oneCtrl: new FormControl('test 1', Validators.required),
  });
  twoGroup = new FormGroup({
    twoCtrl: new FormControl('test 2', Validators.required),
  });
  threeGroup = new FormGroup({
    threeCtrl: new FormControl('test 3', Validators.required),
  });
}

@Component({
  template: `
    <mat-stepper linear>
      @for (step of steps; track step) {
        <mat-step [label]="step.label" [completed]="step.completed"></mat-step>
      }
    </mat-stepper>
  `,
  imports: [MatStepperModule],
})
class SimpleStepperWithoutStepControl {
  @ViewChild(MatStepper) stepper: MatStepper;
  steps = [
    {label: 'One', completed: false},
    {label: 'Two', completed: false},
    {label: 'Three', completed: false},
  ];
}

@Component({
  template: `
    <mat-stepper linear>
      @for (step of steps; track step) {
        <mat-step
          [label]="step.label"
          [stepControl]="step.control"
          [completed]="step.completed"></mat-step>
      }
    </mat-stepper>
  `,
  imports: [MatStepperModule],
})
class SimpleStepperWithStepControlAndCompletedBinding {
  @ViewChild(MatStepper) stepper: MatStepper;

  steps = [
    {label: 'One', completed: false, control: new FormControl('')},
    {label: 'Two', completed: false, control: new FormControl('')},
    {label: 'Three', completed: false, control: new FormControl('')},
  ];
}

@Component({
  template: `
    <mat-stepper>
      <ng-template matStepperIcon="edit">Custom edit</ng-template>
      <ng-template matStepperIcon="done">Custom done</ng-template>
      <ng-template matStepperIcon="number" let-index="index">
        {{getRomanNumeral(index + 1)}}
      </ng-template>

      <mat-step>Content 1</mat-step>
      <mat-step>Content 2</mat-step>
      <mat-step>Content 3</mat-step>
    </mat-stepper>
`,
  imports: [MatStepperModule],
})
class IconOverridesStepper {
  @ViewChild(MatStepper) stepper: MatStepper;

  getRomanNumeral(value: number) {
    const numberMap: {[key: number]: string} = {
      1: 'I',
      2: 'II',
      3: 'III',
      4: 'IV',
      5: 'V',
      6: 'VI',
      7: 'VII',
      8: 'VIII',
      9: 'IX',
    };

    return numberMap[value];
  }
}

@Component({
  template: `
    <mat-stepper>
      @if (true) {
        <ng-template matStepperIcon="edit">Custom edit</ng-template>
        <ng-template matStepperIcon="done">Custom done</ng-template>
        <ng-template matStepperIcon="number" let-index="index">
          {{getRomanNumeral(index + 1)}}
        </ng-template>
      }

      <mat-step>Content 1</mat-step>
      <mat-step>Content 2</mat-step>
      <mat-step>Content 3</mat-step>
    </mat-stepper>
`,
  imports: [MatStepperModule],
})
class IndirectDescendantIconOverridesStepper extends IconOverridesStepper {}

@Component({
  template: `
    <mat-stepper linear>
      <mat-step label="Step 1" [stepControl]="controls[0]"></mat-step>
      <mat-step label="Step 2" [stepControl]="controls[1]" [optional]="step2Optional"></mat-step>
      <mat-step label="Step 3" [stepControl]="controls[2]"></mat-step>
    </mat-stepper>
  `,
  imports: [MatStepperModule],
})
class LinearStepperWithValidOptionalStep {
  controls = [0, 0, 0].map(() => new FormControl(''));
  step2Optional = signal(false);
}

@Component({
  template: `
    <mat-stepper>
      <mat-step [aria-label]="ariaLabel()" [aria-labelledby]="ariaLabelledby()" label="One"></mat-step>
    </mat-stepper>
  `,
  imports: [MatStepperModule],
})
class StepperWithAriaInputs {
  ariaLabel = signal('');
  ariaLabelledby = signal('');
}

@Component({
  template: `
    <mat-stepper orientation="vertical">
      @if (true) {
        <mat-step label="Step 1">Content 1</mat-step>
        <mat-step label="Step 2">Content 2</mat-step>
        <mat-step label="Step 3">Content 3</mat-step>
      }
    </mat-stepper>
  `,
  imports: [MatStepperModule],
})
class StepperWithIndirectDescendantSteps {
  @ViewChild(MatStepper) stepper: MatStepper;
}

@Component({
  template: `
    <mat-stepper orientation="vertical">
      <mat-step>
        <ng-template matStepLabel>Step 1</ng-template>
      </mat-step>

      @if (showStep2()) {
        <mat-step>
          <ng-template matStepLabel>Step 2</ng-template>
        </mat-step>
      }
    </mat-stepper>
  `,
  imports: [MatStepperModule],
})
class StepperWithNgIf {
  showStep2 = signal(false);
}

@Component({
  template: `
    <mat-stepper orientation="vertical">
      <mat-step label="Step 1">Content 1</mat-step>
      <mat-step label="Step 2">Content 2</mat-step>
      <mat-step label="Step 3">
        <mat-stepper>
          <mat-step label="Sub-Step 1">Sub-Content 1</mat-step>
          <mat-step label="Sub-Step 2">Sub-Content 2</mat-step>
        </mat-stepper>
      </mat-step>
    </mat-stepper>
  `,
  imports: [MatStepperModule],
})
class NestedSteppers {
  @ViewChildren(MatStepper) steppers: QueryList<MatStepper>;
}

@Component({
  template: `
    <mat-stepper orientation="vertical" selectedIndex="1337">
      <mat-step label="Step 1">Content 1</mat-step>
      <mat-step label="Step 2">Content 2</mat-step>
      <mat-step label="Step 3">Content 3</mat-step>
    </mat-stepper>
  `,
  imports: [MatStepperModule],
})
class StepperWithStaticOutOfBoundsIndex {
  @ViewChild(MatStepper) stepper: MatStepper;
}

@Component({
  template: `
    <mat-stepper orientation="vertical" [selectedIndex]="selectedIndex()">
      <mat-step>
        <ng-template matStepLabel>Step 1</ng-template>
        <ng-template matStepContent>Step 1 content</ng-template>
      </mat-step>
      <mat-step>
        <ng-template matStepLabel>Step 2</ng-template>
        <ng-template matStepContent>Step 2 content</ng-template>
      </mat-step>
      <mat-step>
        <ng-template matStepLabel>Step 3</ng-template>
        <ng-template matStepContent>Step 3 content</ng-template>
      </mat-step>
    </mat-stepper>
  `,
  imports: [MatStepperModule],
})
class StepperWithLazyContent {
  selectedIndex = signal(0);
}

@Component({
  template: `
    <mat-stepper>
      <mat-step label="Step 1">Content 1</mat-step>
      @if (renderSecondStep()) {
        <mat-step label="Step 2">Content 2</mat-step>
      }
      <mat-step label="Step 3">Content 3</mat-step>
    </mat-stepper>
  `,
  imports: [MatStepperModule],
})
class HorizontalStepperWithDelayedStep {
  @ViewChild(MatStepper) stepper: MatStepper;
  renderSecondStep = signal(false);
}

@Component({
  template: `
    <mat-stepper [(selectedIndex)]="index">
      <mat-step label="One"></mat-step>
      <mat-step label="Two"></mat-step>
      <mat-step label="Three"></mat-step>
    </mat-stepper>
  `,
  imports: [MatStepperModule],
})
class StepperWithTwoWayBindingOnSelectedIndex {
  index: number = 0;
}
