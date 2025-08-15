export interface AnalysisRequest {
  dataSource1: string;
  dataSource2: string;
  startDate: string;
  endDate: string;
}

export interface DataPoint {
  date: string;
  value: number;
}

export interface AnalysisResult {
  correlation: number;
  data1: DataPoint[];
  data2: DataPoint[];
  dataSource1Name: string;
  dataSource2Name: string;
}
