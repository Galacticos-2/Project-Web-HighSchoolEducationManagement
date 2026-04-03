import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, startOfWeek, addDays, addWeeks, isSameDay } from "date-fns";  //Dùng trong các hàm startOfWeek(Tính thứ 2 đầu tuần), addDays(Tạo danh sách ngày), addWeeks(Chuyển tuần), isSameDay(Check hôm nay), format(Format ngày)
import { vi } from "date-fns/locale";
import { message } from "antd";  //dùng để hiển thị thông báo UI
import { SketchPicker } from "react-color";  //thư viện dùng color picker, có thể dùng để chọn màu cho các lớp học trên lịch
import UserActions from "../components/UserActions";
import Brand from "../components/Brand";
import { useAuth } from "../context/useAuth";
import { virtualClassesApi } from "../api/virtualClassesApi";
import "../styles/TeacherSchedulePage.css";

const PERIODS = [
    { key: 1, label: "Tiết 1", time: "07:00 - 07:45", session: "SÁNG" },
    { key: 2, label: "Tiết 2", time: "07:50 - 08:35", session: "SÁNG" },
    { key: 3, label: "Tiết 3", time: "08:50 - 09:35", session: "SÁNG" },
    { key: 4, label: "Tiết 4", time: "09:40 - 10:25", session: "SÁNG" },
    { key: 5, label: "Tiết 5", time: "10:30 - 11:15", session: "SÁNG" },
    { key: 6, label: "Tiết 6", time: "13:00 - 13:45", session: "CHIỀU" },
    { key: 7, label: "Tiết 7", time: "13:50 - 14:35", session: "CHIỀU" },
    { key: 8, label: "Tiết 8", time: "14:40 - 15:25", session: "CHIỀU" },
    { key: 9, label: "Tiết 9", time: "15:40 - 16:25", session: "CHIỀU" },
    { key: 10, label: "Tiết 10", time: "16:30 - 17:15", session: "CHIỀU" },
];

const DAY_LABELS = [
    "THỨ 2",
    "THỨ 3",
    "THỨ 4",
    "THỨ 5",
    "THỨ 6",
    "THỨ 7",
    "CHỦ NHẬT",
];



export default function TeacherSchedulePage() {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [weekStart, setWeekStart] = useState(
        startOfWeek(new Date(), { weekStartsOn: 1 })
    );
    const [originalClassColors, setOriginalClassColors] = useState({});
    const { profile, clearAuthState } = useAuth();
    const [openColorPickerFor, setOpenColorPickerFor] = useState(null);
    const fullName = profile?.fullName || "Giáo viên";
    const avatarLetter = (fullName?.trim()?.[0] || "T").toUpperCase();
    const avatarURL = profile?.avatarURL || "";
    const [classColors, setClassColors] = useState({});
    const [savingColorClassId, setSavingColorClassId] = useState(null);
    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            try {
                const [scheduleRes, colorsRes] = await Promise.all([
                    virtualClassesApi.listTeacher({
                        page: 1,
                        pageSize: 1000,
                    }),
                    virtualClassesApi.getTeacherClassColors(),
                ]);

                const raw = scheduleRes?.data?.items ?? scheduleRes?.data ?? [];

                const mapped = raw.map((item) => ({
                    id: item.id,
                    classId: item.classId,
                    className: item.className,
                    subjectName: item.subjectName,
                    period: Number(item.period),
                    start: new Date(item.startTime),
                    end: new Date(item.endTime),
                    meetingUrl: item.meetingUrl,
                    teacherName: item.teacherName,
                }));

                const colorMap = {};
                (colorsRes?.data || []).forEach((c) => {
                    colorMap[c.classId] = c.colorHex;
                });

                if (isMounted) {
                    setEvents(mapped);
                    setClassColors(colorMap);
                }
            } catch {
                message.error("Không tải được dữ liệu");
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, []);
    const uniqueClasses = useMemo(() => {
        const map = new Map();

        events.forEach((e) => {
            if (!map.has(e.classId)) {
                map.set(e.classId, {
                    classId: e.classId,
                    className: e.className,
                });
            }
        });

        return Array.from(map.values()).sort((a, b) =>
            a.className.localeCompare(b.className)
        );
    }, [events]);
    const handleColorPreviewChange = (classId, colorHex) => {
        setClassColors((prev) => ({
            ...prev,
            [classId]: colorHex,
        }));
    };

    const handleColorSave = async (classItem) => {
        const oldColor = originalClassColors[classItem.classId] || "#2f80ed";
        const colorHex = classColors[classItem.classId] || "#2f80ed";

        setSavingColorClassId(classItem.classId);

        try {
            await virtualClassesApi.saveTeacherClassColor({
                classId: classItem.classId,
                colorHex,
            });

            message.success(`Đã lưu màu cho lớp ${classItem.className}`);
            setOpenColorPickerFor(null);

            setOriginalClassColors((prev) => {
                const next = { ...prev };
                delete next[classItem.classId];
                return next;
            });
        } catch (error) {
            setClassColors((prev) => ({
                ...prev,
                [classItem.classId]: oldColor,
            }));

            message.error(
                error?.response?.data?.message || "Không lưu được màu lớp"
            );
        } finally {
            setSavingColorClassId(null);
        }
    };
    const weekDays = useMemo(() => {
        return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
    }, [weekStart]);

    const groupedEvents = useMemo(() => {
        const map = {};

        for (const event of events) {
            const eventDate = new Date(event.start);

            weekDays.forEach((day, dayIndex) => {
                if (isSameDay(eventDate, day)) {
                    const periodKey = Number(event.period);
                    const cellKey = `${dayIndex}-${periodKey}`;

                    if (!map[cellKey]) {
                        map[cellKey] = [];
                    }
                    map[cellKey].push(event);
                }
            });
        }

        return map;
    }, [events, weekDays]);

    const openMeeting = (event) => {
        let url = event?.meetingUrl || "";

        if (!url) {
            message.error("Không có link lớp");
            return;
        }

        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = `https://${url}`;
        }

        window.open(url, "_blank", "noopener,noreferrer");
    };

    const goPrevWeek = () => setWeekStart((prev) => addWeeks(prev, -1));
    const goNextWeek = () => setWeekStart((prev) => addWeeks(prev, 1));
    const goCurrentWeek = () =>
        setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

    const morningPeriods = PERIODS.filter((p) => p.session === "SÁNG");
    const afternoonPeriods = PERIODS.filter((p) => p.session === "CHIỀU");

    const renderRows = (periods, sessionLabel) => {
        return periods.map((period, idx) => (
            <tr key={period.key}>
                {idx === 0 && (
                    <td className="schedule-session-cell" rowSpan={periods.length}>
                        {sessionLabel}
                    </td>
                )}

                <td className="schedule-time-cell">
                    <div className="period-label">{period.label}</div>
                    <div className="period-time">{period.time}</div>
                </td>

                {weekDays.map((day, dayIndex) => {
                    const isToday = isSameDay(day, new Date());
                    const cellKey = `${dayIndex}-${period.key}`;
                    const cellEvents = groupedEvents[cellKey] || [];

                    return (
                        <td
                            key={`${dayIndex}-${period.key}`}
                            className={`schedule-data-cell ${isToday ? "today-column" : ""}`}
                        >
                            <div className="cell-content">
                                {cellEvents.map((event) => (
                                    <button
                                        key={event.id}
                                        className="schedule-event-card"
                                        style={{
                                            backgroundColor:
                                                classColors[event.classId] || "#2f80ed",
                                        }}
                                        onClick={() => openMeeting(event)}
                                        type="button"
                                    >
                                        <div className="event-class">{event.className}</div>
                                        <div className="event-subject">{event.subjectName}</div>
                                        <div className="event-meta">Tiết {event.period}</div>
                                    </button>
                                ))}
                            </div>
                        </td>
                    );
                })}
            </tr>
        ));
    };

    return (
        <div className="teacher-home">
            <div className="teacher-topbar">
                <div className="teacher-topbar__inner">
                    <Brand variant="teacher" />

                    <UserActions
                        variant="teacher"
                        fullName={fullName}
                        avatarLetter={avatarLetter}
                        avatarURL={avatarURL}
                        onMyAccount={() => navigate("/my-info")}
                        onChangePassword={() => console.log("change password")}
                        onLogout={() => {
                            clearAuthState();
                            navigate("/login", { replace: true });
                        }}
                    />
                </div>
            </div>

            <div className="teacher-schedule-page">
                <div className="schedule-page-header">
                    <h2>Thời khóa biểu giảng dạy</h2>

                    <div className="schedule-toolbar">
                        <div className="schedule-week-nav">
                            <button
                                className="week-arrow-btn"
                                onClick={goPrevWeek}
                                type="button"
                                aria-label="Tuần trước"
                            >
                                ‹
                            </button>

                            <button
                                className="schedule-week-range"
                                onClick={goCurrentWeek}
                                type="button"
                                title="Về tuần hiện tại"
                            >
                                {format(weekStart, "dd/MM/yyyy")} - {format(addDays(weekStart, 6), "dd/MM/yyyy")}
                            </button>

                            <button
                                className="week-arrow-btn"
                                onClick={goNextWeek}
                                type="button"
                                aria-label="Tuần sau"
                            >
                                ›
                            </button>
                        </div>
                    </div>
                </div>
                <div className="schedule-color-toolbar">
                    {uniqueClasses.map((item) => (
                        <div key={item.classId} className="schedule-color-item">
                            <button
                                type="button"
                                className="schedule-color-trigger"
                                onClick={() => {
                                    if (openColorPickerFor !== item.classId) {
                                        setOriginalClassColors((prev) => ({
                                            ...prev,
                                            [item.classId]: classColors[item.classId] || "#2f80ed",
                                        }));
                                    }

                                    setOpenColorPickerFor(
                                        openColorPickerFor === item.classId ? null : item.classId
                                    );
                                }}
                            >
                                <span
                                    className="schedule-color-swatch"
                                    style={{
                                        backgroundColor:
                                            classColors[item.classId] || "#2f80ed",
                                    }}
                                />
                                {item.className}
                            </button>

                            {openColorPickerFor === item.classId && (
                                <div className="schedule-color-popover">
                                    <div
                                        className="schedule-color-cover"
                                        onClick={() => setOpenColorPickerFor(null)}
                                    />

                                    <div className="schedule-color-picker-panel">
                                        <SketchPicker
                                            color={classColors[item.classId] || "#2f80ed"}
                                            onChange={(color) => handleColorPreviewChange(item.classId, color.hex)}
                                        />

                                        <button
                                            type="button"
                                            className="schedule-color-save-btn"
                                            onClick={() => handleColorSave(item)}
                                            disabled={savingColorClassId === item.classId}
                                        >
                                            {savingColorClassId === item.classId ? "Đang lưu..." : "Lưu màu"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <div className="schedule-table-wrapper">
                    <table className="schedule-table">
                        <thead>
                            <tr>
                                <th colSpan={2} className="schedule-corner-header">
                                    <span className="corner-top-label">THỨ</span>
                                    <span className="corner-bottom-label">THỜI GIAN</span>
                                </th>

                                {weekDays.map((day, index) => {
                                    const isToday = isSameDay(day, new Date());

                                    return (
                                        <th
                                            key={day.toISOString()}
                                            className={`schedule-day-header ${isToday ? "today-column" : ""}`}
                                        >
                                            <div className="day-name">{DAY_LABELS[index]}</div>
                                            <div className="day-date">
                                                {format(day, "dd/MM/yyyy", { locale: vi })}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>

                        <tbody>
                            {renderRows(morningPeriods, "SÁNG")}
                            {renderRows(afternoonPeriods, "CHIỀU")}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}