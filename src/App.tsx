import React, { useCallback, useState } from 'react';
import { DatePicker, DatePickerProps, Space, Button, Switch, Slider, Image, InputNumber, Flex, Popconfirm, Select, Divider } from 'antd';
import { GpsSender } from './utils';
import './my.css'
import { MinusOutlined, PlusOutlined, SyncOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const gpsSender = new GpsSender();

// I need a timer that generates data at regular intervals and then sends the data to the backend.
// When generating the data, I need to send the latitude, longitude, and time string to the backend.

// I want to keep only four decimal places for currentLat and currentLon.

const App: React.FC = () => {
    const [dateTimeValue, setDateTimeValue] = useState('');
    const [directValue, setDirectValue] = useState(0);
    const [cornerTime, setCornerTime] = useState(5); // [s]
    const [targetDirectValue, setTargetDirectValue] = useState(0);
    const [isStart, setIsStart] = useState(false);
    const [ongoing, setOngoing] = useState(false);
    const [currentDateTime, setCurrentDateTime] = useState(new Date());
    const [rmDate, setRmDate] = useState<string>(); // [s
    const [firstSendGpsPoint, setFirstSendGpsPoint] = useState(true);
    const [timeoutList, setTimeoutList] = useState<number[]>([]);
    const [mode, setMode] = useState<number>(1);

    const [currentLat, setCurrentLat] = useState(0);
    const [currentLon, setCurrentLon] = useState(0);

    const marks = {
        0: 'North',
        90: 'East',
        180: 'South',
        270: 'West',
        359: 'North'
      };

    const onDateTimeOk = (value: DatePickerProps['value']) => {
        const v = value!.format('YYYY-MM-DDTHH:mm:ssZ');
        setCurrentDateTime(new Date(v))
        console.log('onOk: ', v, currentDateTime);
        setDateTimeValue(v)
    };

    const deleteTimeDataChange = (value: DatePickerProps['value']) => {
        const date = value!.format('YYYY-MM-DD');
        setRmDate(date);
    }

    const confirm = () => {
        console.log('rmDate: ', rmDate);
        gpsSender.rmdata(rmDate!).then((res) => {
            console.log('res: ', res);
            setRmDate(undefined);
        }).catch((e) => {
            console.log('error', e);
        })
    }

    const onDirectChange = (e: number | null) => {
        if (e === null) {
            return;
        }
        setDirectValue(e);
    };

    const submitData = useCallback(async (checked: boolean, defaultDirectValue?: number) => {
        if (!checked) {
            gpsSender.sendGpsPoint({
                isStart: false,
                direct: 0,
                direction: directValue,
            }).then((res) => {
                console.log('res: ', res);
            }).catch((e) => {
                console.log('error', e);
            })
        }
        if (checked) {
            const currentDatetimeStr = currentDateTime.toISOString();
            const baseParams = {
                lat: currentLat,
                lon: currentLon,
                datetime: currentDatetimeStr,
            }
            // gpsSender.sendGpsPoint(newLat, newLon, timeString);
            const params = {
                isStart: checked,
                direct: 0,
                direction: typeof defaultDirectValue === 'number'  ? defaultDirectValue : directValue,
                mode: mode,
            }
            if (firstSendGpsPoint) {
                setFirstSendGpsPoint(false);
                await gpsSender.sendGpsPoint({...params, ...baseParams}).then((res) => {
                    console.log('res: ', res);
                }).catch((e) => {
                    console.log('error', e);
                })
            } else {
                await gpsSender.sendDirection(params).then((res) => {
                    console.log('res: ', res);
                    // setFirstSendGpsPoint(false);
                }).catch((e) => {
                    console.log('error', e);
                })
            }
        }
    }, [currentDateTime, currentLat, currentLon, directValue, firstSendGpsPoint, mode])

    const onSwitchChange = async (checked: boolean) => {
        setIsStart(checked);
        if (!checked) {
            setOngoing(false);
            setFirstSendGpsPoint(true);
            timeoutList.forEach((timeout) => {
                clearTimeout(timeout);
            })
        }
        await submitData(checked);
    };

    const onResetData = () => {
        setIsStart(false);
        setDateTimeValue('');
        setCurrentLat(0);
        setCurrentLon(0);
    };

    const onPlusClick = () => {
        setDirectValue(directValue + 1);
        submitData(isStart, directValue + 1);
    }

    const onMinusClick = () => {
        setDirectValue(directValue - 1);
        submitData(isStart, directValue - 1);
    }

    const onStart = () => {
        const unitDirect = (targetDirectValue - directValue) / cornerTime;
        if (unitDirect === 0) {
            return;
        }
        setOngoing(true);
        const timeoutList = [];
        for (let i = 1; i <= cornerTime; i++) {
            const timeout = setTimeout(() => {
                setDirectValue(directValue + unitDirect*i);
                submitData(isStart, directValue + unitDirect*i);
                if (i === cornerTime) {
                    setOngoing(false);
                }
            }, i * cornerTime * 500);
            timeoutList.push(timeout);
        }
        setTimeoutList(timeoutList);
    };

    return (
        <div className='container'>
            <nav className='navbar'>
                <Image width={40} height={40} src="/svv.png" />
                <a className='a' href='/'>Spray Data Simulator</a>
                <Space direction="horizontal" size={20} align="center">
                    <Button onClick={onResetData}>Data reset</Button>
                    <Switch onChange={onSwitchChange} checkedChildren="Enable" disabled={!dateTimeValue} unCheckedChildren="Pause" value={isStart} />
                </Space>
            </nav>

            <div className='content'>
                <div className='left-content'>
                    <div className='first-bar'>
                        <h3>Set initial position</h3>
                        <Space direction="vertical" size={20} align="start">
                            <div className='one'>
                                <label htmlFor="lat" style={{ marginRight: '10px' }}>Lat: </label>
                                <InputNumber min={-90} max={90} id="lat" name="lat" value={currentLat} disabled={isStart} onChange={(e) => {
                                    setCurrentLat(Number(e))
                                }}
                                addonAfter={<SyncOutlined onClick={() => {
                                    setCurrentLat(Number((Math.random() * 180 - 90).toFixed(4)))
                                }} />} />
                            </div>
                            <div className='one'>
                                <label htmlFor="lon" style={{ marginRight: '10px' }}>lon: </label>
                                <InputNumber min={-180} max={180} type="number" id="lon" name="lon" disabled={isStart} value={currentLon} onChange={(e) => {
                                    setCurrentLon(Number(e))
                                }}
                                addonAfter={<SyncOutlined onClick={() => {
                                    setCurrentLon(Number((Math.random() * 360 - 180).toFixed(4)))
                                }} />}/>
                            </div>
                        </Space>
                    </div>

                    <div className='first-bar'>
                        <h3>Set initial time</h3>
                        <Space direction="vertical" size={10} align="start">
                            <DatePicker showTime onChange={onDateTimeOk} disabled={isStart} />
                        </Space>
                    </div>

                    <div className='first-bar'>
                        <h3>Path pattern</h3>
                        <Space direction="vertical" size={10} align="start">
                            <Select
                                disabled={isStart}
                                value={mode}
                                onChange={(e) => {
                                    setMode(e);
                                }}
                                options={[
                                    { value: 1, label: 'Lateral zigzag route' },
                                    { value: 2, label: 'Vertical zigzag route' },
                                ]}
                            />
                        </Space>
                    </div>

                    {
                        false &&
                        <div className='first-bar'>
                            <h3>Set initial direction</h3>
                            <Slider min={0} max={359} marks={marks} disabled={isStart} defaultValue={directValue} onChange={onDirectChange} value={directValue}/>
                            <InputNumber
                                min={0}
                                max={359}
                                style={{ margin: '16px 0' }}
                                value={directValue}
                                onChange={onDirectChange}
                                addonAfter="°"
                                disabled={isStart}
                            />
                            {
                                false && <Flex gap="middle" vertical>
                                <Button onClick={() => onPlusClick()} disabled={!isStart || directValue>=359 || ongoing}><PlusOutlined /></Button>
                                <Button onClick={() => onMinusClick()} disabled={!isStart || directValue<=0 || ongoing}><MinusOutlined /></Button>
                            </Flex>
                            }
                        </div>
                    }
                    <Divider style={{marginBottom: 0}} />
                    <div className='first-bar'>
                        <h3>Delete selected date data</h3>
                        <Space direction='horizontal' size={10} align="start">
                            <DatePicker onChange={deleteTimeDataChange} disabled={isStart} value={rmDate ? dayjs(rmDate) : undefined} />
                            <Popconfirm
                                title="Delete data?"
                                description="Are you sure you want to delete the data for this day?"
                                onConfirm={confirm}
                                // onCancel={cancel}
                                okText="Yes"
                                cancelText="No"
                            >
                                <Button danger disabled={!rmDate}>Delete</Button>
                            </Popconfirm>
                        </Space>
                    </div>
                    
                    {
                        isStart && false && <>
                            <div className='first-bar'>
                                <h3>Corner time (s)</h3>
                                <InputNumber
                                    min={1}
                                    max={10}
                                    style={{ margin: '16px 0' }}
                                    value={cornerTime}
                                    onChange={(e) => setCornerTime(Number(e) || 1)}
                                    addonAfter="s"
                                    disabled={ongoing}
                                />
                            </div>

                            <div className='first-bar'>
                                <h3>Set target direction</h3>
                                <Slider min={0} max={359} marks={marks} disabled={ongoing} defaultValue={targetDirectValue} onChange={(e) => setTargetDirectValue(Number(e))} value={targetDirectValue}/>
                                <InputNumber
                                    min={0}
                                    max={359}
                                    style={{ margin: '16px 0' }}
                                    value={targetDirectValue}
                                    onChange={e => setTargetDirectValue(Number(e))}
                                    addonAfter="°"
                                    disabled={ongoing}
                                />
                                <Flex gap="middle" vertical>
                                    <Button onClick={() => onStart()} loading={ongoing}>Start</Button>
                                </Flex>
                            </div>   
                        </>
                    }
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