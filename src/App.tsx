import React, { useEffect, useState } from 'react';
import { DatePicker, DatePickerProps, Input, Space, Button, Switch, Slider, Image } from 'antd';
import type { RadioChangeEvent } from 'antd';
import { GpsSender } from './utils';
import { Radio } from 'antd';
import './my.css'


/*
需求如下:
当点击 Switch 为 开启的时候，获取界面输入的经纬度数据，以及时间数据，以及方向数据，根据时间间隔(单位:秒)，定时
生成数据，并且将 经纬度和时间字符串向后端发起请求，将数据传过去

*/

const gpsSender = new GpsSender(3);

const LatlonStep = 0.0001;

const move = (lat: number, lon: number, direct: number) => {
    switch (direct) {
        case 1:
            return [lat + LatlonStep, lon];
        case 2:
            return [lat - LatlonStep, lon];
        case 3:
            return [lat, lon + LatlonStep];
        case 4:
            return [lat, lon - LatlonStep];
        default:
            return [lat, lon];
    }
}

// 我需要一个定时器，每隔一段时间，就生成一个数据，然后将数据传给后端
// 生成数据的时候，需要将经纬度和时间字符串传给后端

// currentLat 和 currentLon 我希望只保留小数点后四位

var currentDateTime = new Date();

const App: React.FC = () => {
    const [dateTimeValue, setDateTimeValue] = useState('');
    const [directValue, setDirectValue] = useState(1);
    const [isStart, setIsStart] = useState(false);
    const [timeInterval, setTimeInterval] = useState(3);

    const [currentLat, setCurrentLat] = useState(0);
    const [currentLon, setCurrentLon] = useState(0);

   

    // dateTimeValue 需要在定时器开始后，根据时间间隔，来更新时间字符串

    useEffect(() => {
        let intervalId: number | null = null;

        if (isStart && dateTimeValue) {
            intervalId = setInterval(() => {
                const [newLat, newLon] = move(currentLat, currentLon, directValue);
                setCurrentLat(newLat);
                setCurrentLon(newLon);

                console.log('gps point: ', newLat, newLon, dateTimeValue);

                console.log('currentDateTime: ', currentDateTime);

                // 这里需要每次更新时间字符串，然后将数据传给后端
                currentDateTime.setSeconds(currentDateTime.getSeconds() + timeInterval);

                // 需要格式化为 2021-08-31T16:00:00Z
                const currentDatetimeStr = currentDateTime.toISOString().replace(/\.\d{3}Z$/, 'Z')

                // gpsSender.sendGpsPoint(newLat, newLon, timeString);
                gpsSender.sendGpsPoint({ lat: newLat, lon: newLon, datetime: currentDatetimeStr })
            }, timeInterval * 1000);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [isStart, dateTimeValue, currentLat, currentLon, directValue, timeInterval]);

    const onDateTimeOk = (value: DatePickerProps['value']) => {
        const v = value!.format('YYYY-MM-DDTHH:mm:ssZ')
        currentDateTime = new Date(v);
        console.log('onOk: ', v, currentDateTime);
        setDateTimeValue(v)
    };

    const onDirectChange = (e: RadioChangeEvent) => {
        setDirectValue(e.target.value);
    };

    const onSwitchChange = (checked: boolean) => {
        setIsStart(checked);
    };

    const onSliderChange = (value: number) => {
        console.log('slider change: ', value);
        setTimeInterval(value);
    }

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
                                <Input type="number" id="lat" name="lat" value={currentLat} onChange={(e) => {
                                    setCurrentLat(Number(e.target.value))
                                }} />
                            </div>
                            <div className='one'>
                                <label htmlFor="lon" style={{ marginRight: '10px' }}>lon: </label>
                                <Input type="number" id="lon" name="lon" value={currentLon} onChange={(e) => {
                                    setCurrentLon(Number(e.target.value))
                                }} />
                            </div>
                        </Space>
                    </div>

                    <div className='first-bar'>
                        <h3>初始时间设定</h3>
                        <Space direction="vertical" size={10} align="start">
                            <DatePicker showTime onOk={onDateTimeOk} />
                        </Space>
                    </div>

                    <div className='first-bar'>
                        <h3>数据生成间隔</h3>
                        <Slider defaultValue={3} max={10} min={1} value={timeInterval} onChange={onSliderChange} />
                    </div>

                    <div className='first-bar'>
                        <h3>方向</h3>
                        <Radio.Group onChange={onDirectChange} value={directValue}>
                            <Radio value={1}>东</Radio>
                            <Radio value={2}>西</Radio>
                            <Radio value={3}>南</Radio>
                            <Radio value={4}>北</Radio>
                        </Radio.Group>
                    </div>
                </div>

                <div className='right-content'>
                    <div className={isStart ? "circle-breath" : "circle-breath-static"}>
                        {isStart ? "run" : "stop"}
                    </div>
                    <Space style={{ marginTop: '50px' }} direction="vertical" size={20} align="start">
                        <text style={{ width: '150px' }}>current position:</text>
                        {/*保留小数点后4位*/}
                        <text style={{ width: '50px' }}>Lat: {currentLat.toFixed(4)}</text>
                        <text style={{ width: '50px' }}>lon: {currentLon.toFixed(4)}</text>
                    </Space>
                </div>
            </div>
        </div>
    )
}

export default App;