// Read-only views of the backend's status endpoints.
//
// All four follow the same shape: start from a pessimistic fallback, fetch
// once on mount, and keep the fallback if the request comes back null (which
// lib/api.ts uses to mean "backend unreachable"). `backendReachable` is
// surfaced separately because the UI says something different for "no model
// trained yet" than for "can't reach the server" — they look identical in the
// data otherwise.
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

interface BackendResource<T> {
  data: T;
  loading: boolean;
  backendReachable: boolean;
}

// Fetch-once-on-mount. These endpoints describe files on disk that only
// change when someone reruns training, so there's nothing to poll for; the
// Model Lab page triggers an explicit refetch after a reload instead.
function useBackendResource<T>(
  fetcher: () => Promise<T | null>,
  fallback: T,
): BackendResource<T> {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [backendReachable, setBackendReachable] = useState(true);

  useEffect(() => {
    void fetcher().then((result) => {
      setBackendReachable(result !== null);
      if (result) setData(result);
      setLoading(false);
    });
    // Fetchers are module-level and stable; re-running on identity would
    // refetch on every render.
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
