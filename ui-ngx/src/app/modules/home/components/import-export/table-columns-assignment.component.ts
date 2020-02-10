///
/// Copyright © 2016-2019 The Thingsboard Authors
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///     http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

import { Component, ElementRef, forwardRef, Input, OnInit } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validator } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AppState } from '@core/core.state';
import { EntityType } from '@shared/models/entity-type.models';
import { CsvColumnParam, ImportEntityColumnType, importEntityColumnTypeTranslations,
         importEntityObjectColumns } from '@home/components/import-export/import-export.models';
import { BehaviorSubject, Observable } from 'rxjs';
import { CollectionViewer, DataSource } from '@angular/cdk/collections';

@Component({
  selector: 'tb-table-columns-assignment',
  templateUrl: './table-columns-assignment.component.html',
  styleUrls: ['./table-columns-assignment.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TableColumnsAssignmentComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => TableColumnsAssignmentComponent),
      multi: true,
    }
  ]
})
export class TableColumnsAssignmentComponent implements OnInit, ControlValueAccessor, Validator {

  @Input() entityType: EntityType;

  @Input() disabled: boolean;

  dataSource = new CsvColumnsDatasource();

  displayedColumns = ['order', 'sampleData', 'type', 'key'];

  importEntityColumnType = ImportEntityColumnType;

  columnTypes: AssignmentColumnType[] = [];

  columnTypesTranslations = importEntityColumnTypeTranslations;

  private columns: CsvColumnParam[];

  private valid = true;

  private propagateChangePending = false;
  private propagateChange = null;

  constructor(public elementRef: ElementRef,
              protected store: Store<AppState>) {
  }

  ngOnInit(): void {
    this.columnTypes.push(
      { value: ImportEntityColumnType.name },
      { value: ImportEntityColumnType.type },
    );
    switch (this.entityType) {
      case EntityType.DEVICE:
        this.columnTypes.push(
          { value: ImportEntityColumnType.sharedAttribute },
          { value: ImportEntityColumnType.serverAttribute },
          { value: ImportEntityColumnType.timeseries },
          { value: ImportEntityColumnType.accessToken }
        );
        break;
      case EntityType.ASSET:
        this.columnTypes.push(
          { value: ImportEntityColumnType.serverAttribute },
          { value: ImportEntityColumnType.timeseries }
        );
        break;
    }
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
    if (this.propagateChangePending) {
      this.propagateChange(this.columns);
      this.propagateChangePending = false;
    }
  }

  registerOnTouched(fn: any): void {
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  columnsUpdated() {
    const isSelectName = this.columns.findIndex((column) => column.type === ImportEntityColumnType.name) > -1;
    const isSelectType = this.columns.findIndex((column) => column.type === ImportEntityColumnType.type) > -1;
    const isSelectCredentials = this.columns.findIndex((column) => column.type === ImportEntityColumnType.accessToken) > -1;
    const hasInvalidColumn = this.columns.findIndex((column) => !this.columnValid(column)) > -1;

    this.valid = isSelectName && isSelectType && !hasInvalidColumn;

    this.columnTypes.find((columnType) => columnType.value === ImportEntityColumnType.name).disabled = isSelectName;
    this.columnTypes.find((columnType) => columnType.value === ImportEntityColumnType.type).disabled = isSelectType;
    const accessTokenColumnType = this.columnTypes.find((columnType) => columnType.value === ImportEntityColumnType.accessToken);
    if (accessTokenColumnType) {
      accessTokenColumnType.disabled = isSelectCredentials;
    }
    if (this.propagateChange) {
      this.propagateChange(this.columns);
    } else {
      this.propagateChangePending = true;
    }
  }

  private columnValid(column: CsvColumnParam): boolean {
    if (!importEntityObjectColumns.includes(column.type)) {
      return column.key && column.key.trim().length > 0;
    } else {
      return true;
    }
  }

  public validate(c: FormControl) {
    return (this.valid) ? null : {
      columnsInvalid: true
    };
  }

  writeValue(value: CsvColumnParam[]): void {
    this.columns = value;
    this.dataSource.setColumns(this.columns);
    this.columnsUpdated();
  }
}

interface AssignmentColumnType {
  value: ImportEntityColumnType;
  disabled?: boolean;
}

class CsvColumnsDatasource implements DataSource<CsvColumnParam> {

  private columnsSubject = new BehaviorSubject<CsvColumnParam[]>([]);

  constructor() {}

  connect(collectionViewer: CollectionViewer): Observable<CsvColumnParam[] | ReadonlyArray<CsvColumnParam>> {
    return this.columnsSubject.asObservable();
  }

  disconnect(collectionViewer: CollectionViewer): void {
    this.columnsSubject.complete();
  }

  setColumns(columns: CsvColumnParam[]) {
    this.columnsSubject.next(columns);
  }

}
