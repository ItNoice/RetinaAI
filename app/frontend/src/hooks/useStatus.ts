import { useEffect, useState } from "react";
import {
  fetchDatasetStatus,
  fetchMetrics,
  fetchModelStatus,
  fetchTrainingLog,
} from "../lib/api";
import {
  DATASET_STATUS,
  MODEL_STATUS,
  type DatasetInfo,
  type ModelStatusInfo,
} from "../lib/modelStatus";
import type { MetricsInfo, TrainingLogInfo } from "../lib/types";

const EMPTY_METRICS: MetricsInfo = {
  available: false,
  note: "No evaluation has been run yet.",
  train: null,
  valid: null,
  test: null,
};

const EMPTY_TRAINING_LOG: TrainingLogInfo = {
  available: false,
  note: "No training run has been logged yet.",
  history: [],
  bestValAcc: null,
  totalTimeS: null,
  hyperparameters: {},
};

export function useModelStatus(): {
  status: ModelStatusInfo;
  backendReachable: boolean;
} {
  const [status, setStatus] = useState(MODEL_STATUS);
  const [backendReachable, setBackendReachable] = useState(true);

  useEffect(() => {
    void fetchModelStatus().then((result) => {
      setBackendReachable(result !== null);
      if (result) setStatus(result);
    });
  }, []);

  return { status, backendReachable };
}

export function useDatasetStatus(): {
  status: DatasetInfo;
  backendReachable: boolean;
} {
  const [status, setStatus] = useState(DATASET_STATUS);
  const [backendReachable, setBackendReachable] = useState(true);

  useEffect(() => {
    void fetchDatasetStatus().then((result) => {
      setBackendReachable(result !== null);
      if (result) setStatus(result);
    });
  }, []);

  return { status, backendReachable };
}

export function useMetrics(): {
  metrics: MetricsInfo;
  loading: boolean;
  backendReachable: boolean;
} {
  const [metrics, setMetrics] = useState(EMPTY_METRICS);
  const [loading, setLoading] = useState(true);
  const [backendReachable, setBackendReachable] = useState(true);

  useEffect(() => {
    void fetchMetrics().then((result) => {
      setBackendReachable(result !== null);
      if (result) setMetrics(result);
      setLoading(false);
    });
  }, []);

  return { metrics, loading, backendReachable };
}

export function useTrainingLog(): {
  trainingLog: TrainingLogInfo;
  loading: boolean;
  backendReachable: boolean;
} {
  const [trainingLog, setTrainingLog] = useState(EMPTY_TRAINING_LOG);
  const [loading, setLoading] = useState(true);
  const [backendReachable, setBackendReachable] = useState(true);

  useEffect(() => {
    void fetchTrainingLog().then((result) => {
      setBackendReachable(result !== null);
      if (result) setTrainingLog(result);
      setLoading(false);
    });
  }, []);

  return { trainingLog, loading, backendReachable };
}
