import React, { useState } from 'react';
import { DatePicker, DatePickerProps, Space, Button, Switch, Slider, Image, InputNumber } from 'antd';
import { GpsSender } from './utils';
import './my.css'
import { useDebounceEffect } from 'ahooks';

const gpsSender = new GpsSender();

// 我需要一个定时器，每隔一段时间，就生成一个数据，然后将数据传给后端
// 生成数据的时候，需要将经纬度和时间字符串传给后端

// currentLat 和 currentLon 我希望只保留小数点后四位

const App: React.FC = () => {
    const [dateTimeValue, setDateTimeValue] = useState('');
    const [directValue, setDirectValue] = useState(0);
    const [isStart, setIsStart] = useState(false);
    const [currentDateTime, setCurrentDateTime] = useState(new Date());
    const [firstSendGpsPoint, setFirstSendGpsPoint] = useState(true);

    const [currentLat, setCurrentLat] = useState(0);
    const [currentLon, setCurrentLon] = useState(0);

    const marks = {
        0: '北',
        90: '东',
        180: '南',
        270: '西',
        359: '北'
      };

    // dateTimeValue 需要在定时器开始后，根据时间间隔，来更新时间字符串
    useDebounceEffect(
    () => {
        if (dateTimeValue && isStart) {
            console.log('currentDateTime: ', currentDateTime);

            // 需要格式化为 2021-08-31T16:00:00+08:00
            // const currentDatetimeStr = currentDateTime.toISOString().replace(/\.\d{3}Z$/, 'Z')
            const currentDatetimeStr = currentDateTime.toISOString();
            const baseParams = {
                lat: currentLat,
                lon: currentLon,
                datetime: currentDatetimeStr,
            }
            // gpsSender.sendGpsPoint(newLat, newLon, timeString);
            const params = {
                isStart: isStart,
                direct: 0,
                direction: directValue
            }
            gpsSender.sendGpsPoint(firstSendGpsPoint ? {...params, ...baseParams} : params).then((res) => {
                console.log('res: ', res);
                setFirstSendGpsPoint(false);
            }).catch((e) => {
                console.log('error', e);
            })

        }
    },
    [isStart, dateTimeValue, currentLat, currentLon, directValue, currentDateTime],
    {
        wait: 1000,
    },
    );

    const onDateTimeOk = (value: DatePickerProps['value']) => {
        const v = value!.format('YYYY-MM-DDTHH:mm:ssZ');
        setCurrentDateTime(new Date(v))
        console.log('onOk: ', v, currentDateTime);
        setDateTimeValue(v)
    };

    const onDirectChange = (e: number | null) => {
        if (e === null) {
            return;
        }
        setDirectValue(e);
    };

    const onSwitchChange = (checked: boolean) => {
        setIsStart(checked);
    };

    const onResetData = () => {
        setIsStart(false);
        setDateTimeValue('');
        setCurrentLat(0);
        setCurrentLon(0);
    };

    return (
        <div className='container'>
            <nav className='navbar'>
                <Image width={40} height={40} src="/svv.png" />
                <a className='a' href='/'>Spray Data Simulator</a>
                <Space direction="horizontal" size={20} align="center">
                    <Button onClick={onResetData}>数据重置</Button>
                    <Switch onChange={onSwitchChange} checkedChildren="开启" unCheckedChildren="暂停" value={isStart} />
                </Space>
            </nav>

            <div className='content'>
                <div className='left-content'>
                    <div className='first-bar'>
                        <h3>初始位置设定</h3>
                        <Space direction="vertical" size={20} align="start">
                            <div className='one'>
                                <label htmlFor="lat" style={{ marginRight: '10px' }}>Lat: </label>
                                <InputNumber min={-90} max={90} id="lat" name="lat" value={currentLat} disabled={isStart} onChange={(e) => {
                                    setCurrentLat(Number(e))
                                }} />
                            </div>
                            <div className='one'>
                                <label htmlFor="lon" style={{ marginRight: '10px' }}>lon: </label>
                                <InputNumber min={-180} max={180} type="number" id="lon" name="lon" disabled={isStart} value={currentLon} onChange={(e) => {
                                    setCurrentLon(Number(e))
                                }} />
                            </div>
                        </Space>
                    </div>

                    <div className='first-bar'>
                        <h3>初始时间设定</h3>
                        <Space direction="vertical" size={10} align="start">
                            <DatePicker showTime onOk={onDateTimeOk} disabled={isStart} />
                        </Space>
                    </div>

                    <div className='first-bar'>
                        <h3>方向</h3>
                        <Slider min={0} max={359} marks={marks} defaultValue={directValue} onChange={onDirectChange} value={directValue}/>
                        <InputNumber
                            min={0}
                            max={359}
                            style={{ margin: '16px 0' }}
                            value={directValue}
                            onChange={onDirectChange}
                            addonAfter="°"
                        />
                    </div>
                </div>

                <div className='right-content'>
                    <div className={isStart ? "circle-breath" : "circle-breath-static"}>
                        {isStart ? "run" : "stop"}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default App;