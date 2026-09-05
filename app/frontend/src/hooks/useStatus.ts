// Read-only views of the backend's status endpoints.
import { useEffect, useState } from "react";
import {
  fetchDatasetStatus,
  fetchMetrics,
  fetchModelStatus,
  fetchTrainingLog,
} from "../lib/api";
import {
  UNAVAILABLE_DATASET_STATUS,
  UNAVAILABLE_MODEL_STATUS,
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

// `backendReachable` is separate because "no model trained yet" and "can't
// reach the server" look identical in the data but need different UI.
interface BackendResource<T> {
  data: T;
  loading: boolean;
  backendReachable: boolean;
}

// Fetch once on mount — these describe files that only change when someone
// reruns training, so there's nothing to poll for.
function useBackendResource<T>(
  fetcher: () => Promise<T | null>,
  fallback: T,
): BackendResource<T> {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [backendReachable, setBackendReachable] = useState(true);

  useEffect(() => {
    void fetcher().then((result) => {
      setBackendReachable(result !== null); // null means unreachable, keep the fallback
      if (result) setData(result);
      setLoading(false);
    });
    // Fetchers are module-level and stable — depending on identity would refetch
    // on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, loading, backendReachable };
}

export function useModelStatus(): {
  status: ModelStatusInfo;
  backendReachable: boolean;
} {
  const { data, backendReachable } = useBackendResource(
    fetchModelStatus,
    UNAVAILABLE_MODEL_STATUS,
  );
  return { status: data, backendReachable };
}

export function useDatasetStatus(): {
  status: DatasetInfo;
  backendReachable: boolean;
} {
  const { data, backendReachable } = useBackendResource(
    fetchDatasetStatus,
    UNAVAILABLE_DATASET_STATUS,
  );
  return { status: data, backendReachable };
}

export function useMetrics(): {
  metrics: MetricsInfo;
  loading: boolean;
  backendReachable: boolean;
} {
  const { data, loading, backendReachable } = useBackendResource(
    fetchMetrics,
    EMPTY_METRICS,
  );
  return { metrics: data, loading, backendReachable };
}

export function useTrainingLog(): {
  trainingLog: TrainingLogInfo;
  loading: boolean;
  backendReachable: boolean;
} {
  const { data, loading, backendReachable } = useBackendResource(
    fetchTrainingLog,
    EMPTY_TRAINING_LOG,
  );
  return { trainingLog: data, loading, backendReachable };
}
