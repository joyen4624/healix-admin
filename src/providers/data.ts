import {
  BaseRecord,
  CreateParams,
  CreateResponse,
  CrudFilters,
  CrudSort,
  CustomParams,
  CustomResponse,
  DataProvider,
  DeleteOneParams,
  DeleteOneResponse,
  GetListParams,
  GetListResponse,
  GetOneParams,
  GetOneResponse,
  UpdateParams,
  UpdateResponse,
} from "@refinedev/core";
import axios, { AxiosError } from "axios";

const API_URL = "http://localhost:3000/api/admin";

const axiosInstance = axios.create({
  baseURL: API_URL,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("healix-admin-token");

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

type ApiListResponse<T> = {
  success?: boolean;
  data?: T[];
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  message?: string;
};

type ApiItemResponse<T> = {
  success?: boolean;
  data?: T;
  message?: string;
};

const toError = (error: unknown): Error => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return new Error(
      axiosError.response?.data?.message ||
        axiosError.message ||
        "Request failed",
    );
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Unknown error");
};

export const dataProvider: DataProvider = {
  getList: async <TData extends BaseRecord = BaseRecord>(
    params: GetListParams,
  ): Promise<GetListResponse<TData>> => {
    try {
      const { resource, pagination, filters, sorters, meta } = params;

      const currentPage = pagination?.currentPage ?? 1;
      const pageSize = pagination?.pageSize ?? 10;

      const queryParams: Record<string, unknown> = {
        page: currentPage,
        limit: pageSize,
      };

      const safeFilters: CrudFilters = filters ?? [];
      for (const filter of safeFilters) {
        if ("field" in filter && "value" in filter) {
          if (
            filter.value !== undefined &&
            filter.value !== null &&
            filter.value !== ""
          ) {
            queryParams[String(filter.field)] = filter.value;
          }
        }
      }

      const safeSorters: CrudSort[] = sorters ?? [];
      if (safeSorters.length > 0) {
        queryParams.sort = safeSorters[0].field;
      }

      if (meta && typeof meta === "object") {
        Object.assign(queryParams, meta as Record<string, unknown>);
      }

      const { data: response } = await axiosInstance.get<
        ApiListResponse<TData>
      >(`/${resource}`, {
        params: queryParams,
      });

      return {
        data: Array.isArray(response?.data) ? response.data : [],
        total: Number(response?.pagination?.total ?? 0),
      };
    } catch (error) {
      throw toError(error);
    }
  },

  getOne: async <TData extends BaseRecord = BaseRecord>(
    params: GetOneParams,
  ): Promise<GetOneResponse<TData>> => {
    try {
      const { resource, id } = params;

      const { data: response } = await axiosInstance.get<
        ApiItemResponse<TData>
      >(`/${resource}/${id}`);

      return {
        data: (response?.data ?? {}) as TData,
      };
    } catch (error) {
      throw toError(error);
    }
  },

  create: async <TData extends BaseRecord = BaseRecord, TVariables = {}>(
    params: CreateParams<TVariables>,
  ): Promise<CreateResponse<TData>> => {
    try {
      const { resource, variables } = params;

      const { data: response } = await axiosInstance.post<
        ApiItemResponse<TData>
      >(`/${resource}`, variables);

      return {
        data: (response?.data ?? {}) as TData,
      };
    } catch (error) {
      throw toError(error);
    }
  },

  update: async <TData extends BaseRecord = BaseRecord, TVariables = {}>(
    params: UpdateParams<TVariables>,
  ): Promise<UpdateResponse<TData>> => {
    try {
      const { resource, id, variables } = params;

      const { data: response } = await axiosInstance.patch<
        ApiItemResponse<TData>
      >(`/${resource}/${id}`, variables);

      return {
        data: (response?.data ?? {}) as TData,
      };
    } catch (error) {
      throw toError(error);
    }
  },

  deleteOne: async <TData extends BaseRecord = BaseRecord, TVariables = {}>(
    params: DeleteOneParams<TVariables>,
  ): Promise<DeleteOneResponse<TData>> => {
    try {
      const { resource, id } = params;

      const { data: response } = await axiosInstance.delete<
        ApiItemResponse<TData>
      >(`/${resource}/${id}`);

      return {
        data: (response?.data ?? { id }) as unknown as TData,
      };
    } catch (error) {
      throw toError(error);
    }
  },

  getApiUrl: () => API_URL,

  custom: async <TData extends BaseRecord = BaseRecord>(
    params: CustomParams,
  ): Promise<CustomResponse<TData>> => {
    try {
      const { url, method, payload, query, headers } = params;

      const { data } = await axiosInstance({
        url,
        method: method ?? "get",
        data: payload,
        params: query,
        headers,
      });

      return { data };
    } catch (error) {
      throw toError(error);
    }
  },
};
