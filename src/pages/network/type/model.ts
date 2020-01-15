import { Effect } from 'dva';
import { Reducer } from 'react';
import apis from '@/services';
// import { SimpleResponse } from '@/utils/common';

export interface NetworkTypeState {
    result: any,
}

export interface NetworkTypeType {
    namespace: string;
    state: NetworkTypeState;
    effects: {
        query: Effect;
        remove: Effect;
        insert: Effect;
    };
    reducers: {
        save: Reducer<any, any>;
    }
}

const NetworkType: NetworkTypeType = {
    namespace: 'networkType',
    state: {
        result: {},
    },
    effects: {
        *query({ payload, callback }, { call, put }) {
            const response: any = yield call(apis.network.list, payload);
            yield put({
                type: 'save',
                payload: response.result,
            });
        },
        *remove({ payload, callback }, { call, put }) {
            const response: any = yield call(apis.network.remove, payload);
            callback(response);
        },
        *insert({ payload, callback }, { call, put }) {
            const response: any = yield call(apis.network.save, payload);
            callback(response);
        }
    },
    reducers: {
        save(state, action) {
            return {
                ...state,
                result: {},
            }
        }
    }
};

export default NetworkType;
