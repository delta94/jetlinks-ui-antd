import React, { useEffect, useState } from 'react';
import { Badge, Descriptions, Icon, message, Row, Spin, Tooltip } from 'antd';
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import { connect } from 'dva';
import { router } from 'umi';
import Info from './detail/Info';
import Status from './detail/Status';
import Log from './detail/Log';
import Debugger from './detail/Debugger';
import Functions from './detail/functions';
import styles from './index.less';
import ConnectState, { Dispatch } from '@/models/connect';
import { SimpleResponse } from '@/utils/common';
import { DeviceInstance } from '../data';
import apis from '@/services';

interface Props {
  dispatch: Dispatch;
  location: Location;
}

interface State {
  data: Partial<DeviceInstance>;
  activeKey: string;
  logs: any;
  deviceState: any;
  deviceFunction: any;
  orgInfo: any;
  config: any;
  spinning:boolean;
}

const Editor: React.FC<Props> = props => {
  const {
    dispatch,
    location: { pathname },
  } = props;

  const initState: State = {
    activeKey: 'info',
    data: {},
    logs: {},
    deviceState: {},
    deviceFunction: {},
    orgInfo: {},
    config: {},
    spinning:true,
  };
  const [activeKey, setActiveKey] = useState(initState.activeKey);
  const [data, setData] = useState(initState.data);
  const [id, setId] = useState();
  const [deviceState, setDeviceState] = useState(initState.deviceState);
  const [deviceFunction, setDeviceFunction] = useState(initState.deviceFunction);
  const [config, setConfig] = useState(initState.config);
  const [orgInfo] = useState(initState.orgInfo);
  const [spinning, setSpinning] = useState(initState.spinning);
  const [tableList, setTableList] = useState();

  const tabList = [
    {
      key: 'info',
      tab: '实例信息',
    },
    {
      key: 'status',
      tab: '运行状态',
    },
    {
      key: 'log',
      tab: '日志管理',
    },
  ];

  const getInfo = (id: string) => {
    setSpinning(true);
    dispatch({
      type: 'deviceInstance/queryById',
      payload: id,
      callback: (response: SimpleResponse) => {
        if (response.status === 200) {
          const data = response.result;
          if (data.orgId) {
            data.orgName = orgInfo[data.orgId];
          }
          if (data.deriveMetadata) {
            const deriveMetadata = JSON.parse(data.deriveMetadata);
            if (deriveMetadata.functions.length > 0) {
              tabList.splice(2, 0, {
                key: 'functions',
                tab: '设备功能',
              });
            }
          }

          apis.deviceProdcut
            .protocolConfiguration(data.protocol, data.transport)
            .then(resp => {
              setConfig(resp.result);
            }).catch();
          setTableList(tabList);
          setData(data);
          setSpinning(false);
        }
      },
    });
  };

  const statusMap = new Map();
  statusMap.set('在线', 'success');
  statusMap.set('离线', 'error');
  statusMap.set('未激活', 'processing');

  useEffect(() => {

    apis.deviceProdcut
      .queryOrganization()
      .then(res => {
        if (res.status === 200) {
          res.result.map(e => (
            orgInfo[e.id] = e.name
          ));
        }
      }).catch(() => {
      });

    if (pathname.indexOf('save') > 0) {
      const list = pathname.split('/');
      getInfo(list[list.length - 1]);
      setId(list[list.length - 1]);
    }
    setTableList(tabList);
  }, []);

  const getDeviceState = () => {
    apis.deviceInstance.runInfo(id).then(response => {
      deviceState.runInfo = response.result;
      setDeviceState({ ...deviceState });
    });
  };

  const getDeviceFunctions = () => {
    apis.deviceInstance.runInfo(id).then(response => {
      deviceFunction.runInfo = response.result;
      setDeviceFunction({ ...deviceFunction });
    });
  };

  const disconnectDevice = (deviceId:string) => {
    setSpinning(true);
    apis.deviceInstance.disconnectDevice(deviceId).then(response => {
      if (response.status === 200){
        message.success("断开连接成功");
        getInfo(deviceId);
      }else{
        message.error("断开连接失败");
      }
    }).catch();
  };

  const action = (
    <Tooltip title='刷新'>
      <Icon type="sync" style={{fontSize:20}} onClick={() => { getInfo(data.id) }}/>
    </Tooltip>
  );

  const info = {
    info: <Info data={data} configuration={config} refresh={()=>{getInfo(data.id)}}/>,
    status: <Status device={data} />,
    functions: <Functions device={data} />,
    log: (
      <Log
        deviceId={id}
      />
    ),
    debugger: <Debugger />,
  };

  const content = (
    <div style={{ marginTop: 30 }}>
      <Descriptions column={4}>
        <Descriptions.Item label="ID">{id}</Descriptions.Item>
        <Descriptions.Item label="型号">
          <div>
            {data.productName}
            <a style={{marginLeft:10}}
              onClick={() => {
                router.push(`/device/product/save/${data.productId}`);
              }}
            >查看</a>
          </div>
        </Descriptions.Item>
      </Descriptions>
    </div>
  );

  const titleInfo = (
      <Row>
        <div>
          <span>
            设备：{data.name}
          </span>
          <Badge style={{marginLeft:20}} status={statusMap.get(data.state?.text)} text={data.state?.text}/>
          {data.state?.value === "online"?(
            <a style={{fontSize:15,marginLeft:20}} onClick={() => { disconnectDevice(data.id) }}>断开连接</a>
          ):(<span/>)}
        </div>
      </Row>
  );

  const extra = (
    <div className={styles.moreInfo}>{ /*<Statistic title="状态" value="未激活" />*/ }</div>
  );

  return (
    <Spin tip="加载中..." spinning={spinning}>
      <PageHeaderWrapper
        className={styles.instancePageHeader}
        style={{ marginTop: 0 }}
        title={titleInfo}
        extra={action}
        content={content}
        extraContent={extra}
        tabList={tableList}
        tabActiveKey={activeKey}
        onTabChange={(key: string) => {
          /*if (key === 'status') {
            getDeviceState();
          } else if (key === 'functions') {
            getDeviceFunctions();
          }*/
          setActiveKey(key);
        }}
      >
        {info[activeKey]}
      </PageHeaderWrapper>
    </Spin>
  );
};

export default connect(({ deviceInstance, loading }: ConnectState) => ({
  deviceInstance,
  loading,
}))(Editor);
