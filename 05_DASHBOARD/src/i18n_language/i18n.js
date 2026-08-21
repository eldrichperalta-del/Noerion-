import i18n from "i18next";
import { initReactI18next } from "react-i18next";

/*
|--------------------------------------------------------------------------
| NOERION TRANSLATIONS
|--------------------------------------------------------------------------
| All dashboard translations are centralized here.
|
| To add another language:
| 1. Add the language code to resources.
| 2. Copy the English structure.
| 3. Translate the values.
|--------------------------------------------------------------------------
*/

const resources = {
    en: {
        translation: {
            common: {
                save: "Save Changes",
                cancel: "Cancel",
                back: "Back",
                next: "Next",
                nextStep: "Next Step",
                close: "Close",
                search: "Search",
                filter: "Filter",
                view: "View",
                viewDetails: "View Details",
                edit: "Edit",
                delete: "Delete",
                submit: "Submit",
                confirm: "Confirm",
                loading: "Loading...",
                noData: "No data available",
                yes: "Yes",
                no: "No",
                status: "Status",
                date: "Date",
                time: "Time",
                duration: "Duration",
                actions: "Actions",
            },

            navigation: {
                dashboard: "Dashboard",
                home: "Home",
                assessments: "Assessments",
                assessmentManagement: "Assessment Management",
                createAssessment: "Create Assessment",
                scheduleAssessment: "Schedule Assessment",
                assessmentHistory: "Assessment History",
                evaluation: "Evaluation",
                resultsMonitoring: "Results Monitoring",
                certificates: "Certificates",
                certificateManagement: "Certificate Management",
                userManagement: "User Management",
                traineeManagement: "Trainee Management",
                assessorManagement: "Assessor Management",
                settings: "Settings",
                account: "My Account",
                preferences: "Preferences",
                notifications: "Notifications",
                logout: "Log Out",
            },

            navbar: {
                notifications: "Notifications",
                profile: "Profile",
                settings: "Settings",
                logout: "Log Out",
            },

            preferences: {
                title: "Preferences",
                description: "Customize your account preferences.",

                language: "Language",
                languageDescription: "Choose your preferred language.",

                timeZone: "Time Zone",
                timeZoneDescription: "Select your current time zone.",

                dateFormat: "Date Format",
                dateFormatDescription: "Choose your preferred date format.",

                theme: "Theme / Appearance",
                themeDescription: "Select your preferred theme.",

                light: "Light",
                dark: "Dark",

                saved: "Preferences saved.",
                error:
                    "Preferences were applied locally but could not be saved to your account.",
            },

            admin: {
                dashboard: "Admin Dashboard",
                welcome: "Welcome to the Admin Dashboard",

                users: "Users",
                trainees: "Trainees",
                assessors: "Assessors",

                assessments: "Assessments",
                assessmentLibrary: "Assessment Library",
                scheduledAssessments: "Scheduled Assessments",

                certificates: "Certificates",
                results: "Results Monitoring",

                totalUsers: "Total Users",
                totalAssessments: "Total Assessments",
                completedAssessments: "Completed Assessments",
                pendingAssessments: "Pending Assessments",

                recentActivity: "Recent Activity",
                upcomingAssessments: "Upcoming Assessments",
            },

            assessor: {
                dashboard: "Assessor Dashboard",
                welcome: "Welcome to the Assessor Dashboard",

                assignedAssessments: "Assigned Assessments",
                assessmentPanel: "Assessment Panel",
                assessmentHistory: "Assessment History",
                evaluation: "Evaluation",
                finalizeEvaluation: "Finalize Evaluation",

                totalAssessments: "Total Assessments",
                completed: "Completed",
                pending: "Pending",
                upcoming: "Upcoming",

                trainees: "Trainees",
                selectedTrainees: "Selected Trainees",
                traineeInformation: "Trainee Information",

                aiAnalysis: "AI Analysis",
                aiInsights: "AI Insights",
                cognitiveReadiness: "Cognitive Readiness",
                consistency: "Consistency",
                riskFlag: "Risk Flag",
            },

            trainee: {
                dashboard: "Trainee Dashboard",
                welcome: "Welcome to your dashboard",

                assessments: "Assessments",
                myAssessments: "My Assessments",
                assessmentSummary: "Assessment Summary",
                results: "Results",
                certificates: "Certificates",

                upcomingAssessments: "Upcoming Assessments",
                completedAssessments: "Completed Assessments",
                pendingAssessments: "Pending Assessments",

                startAssessment: "Start Assessment",
                continueAssessment: "Continue Assessment",
                viewResults: "View Results",
                viewCertificate: "View Certificate",

                performance: "Performance",
                score: "Score",
                overallResult: "Overall Result",
                feedback: "Feedback",
            },

            assessment: {
                assessment: "Assessment",
                assessmentDetails: "Assessment Details",
                assessmentType: "Assessment Type",
                qualification: "Qualification",
                course: "Course",
                instructions: "Instructions",
                questions: "Questions",
                question: "Question",
                answer: "Answer",
                correctAnswer: "Correct Answer",
                choices: "Choices",

                multipleChoice: "Multiple Choice",
                trueFalse: "True or False",
                identification: "Identification",
                matchingType: "Matching Type",
                situational: "Situational",

                createAssessment: "Create Assessment",
                chooseAssessment: "Choose Assessment",
                scheduleAssessment: "Schedule Assessment",

                assessmentDate: "Assessment Date",
                startTime: "Start Time",
                endTime: "End Time",

                selectedCourse: "Selected Course",
                selectedTrainees: "Selected Trainees",
                assignedAssessor: "Assigned Assessor",

                reviewConfirm: "Review & Confirm",
            },

            schedule: {
                title: "Schedule Assessment",
                description:
                    "Organize assessment schedules, participants, and assessor assignments.",

                setDateTime: "Set the assessment date and time.",

                selected: "Selected",
                selectDate: "Select a date",
                selectTimeRange: "Select time range",

                invalidTime: "Invalid time range",

                completeFields:
                    "Please complete date, start time, and end time correctly.",

                assessmentDetailsSummary: "Assessment Details Summary",

                noAssessment: "No assessment selected",
                noTrainees: "No trainees selected",
                noAssessor: "None",

                autoCalculated: "Auto-calculated",

                chooseAssessment: "Choose Assessment",
            },

            results: {
                title: "Results Monitoring",
                searchPlaceholder: "Search by trainee name or ID...",
                dateRange: "Date Range",

                totalResults: "Total Results",
                passed: "Passed",
                failed: "Failed",
                pending: "Pending",

                competent: "Competent",
                notYetCompetent: "Not Yet Competent",
            },

            certificates: {
                title: "Certificate Management",
                certificate: "Certificate",
                certificateId: "Certificate ID",
                trainee: "Trainee",
                course: "Course",
                status: "Status",
                dateIssued: "Date Issued",

                issued: "Issued",
                revoked: "Revoked",
                pending: "Pending",

                viewCertificate: "View Certificate",
                verifyCertificate: "Verify Certificate",
            },

            account: {
                settings: "Account Settings",
                myAccount: "My Account",
                accountSecurity: "Account & Security",
                personalInformation: "Personal Information",
                activeSessions: "Active Sessions",
                twoFactorAuthentication: "Two-Factor Authentication",
                notifications: "Notifications",
                systemPreferences: "System Preferences",
            },

            messages: {
                saved: "Changes saved successfully.",
                updated: "Updated successfully.",
                deleted: "Deleted successfully.",
                noResults: "No results found.",
                noAssessments: "No assessments found.",
                noCertificates: "No certificates found.",
            },
        },
    },

    fil: {
        translation: {
            common: {
                save: "I-save ang mga Pagbabago",
                cancel: "Kanselahin",
                back: "Bumalik",
                next: "Susunod",
                nextStep: "Susunod na Hakbang",
                close: "Isara",
                search: "Maghanap",
                filter: "Salain",
                view: "Tingnan",
                viewDetails: "Tingnan ang Detalye",
                edit: "I-edit",
                delete: "Tanggalin",
                submit: "Isumite",
                confirm: "Kumpirmahin",
                loading: "Naglo-load...",
                noData: "Walang datos",
                yes: "Oo",
                no: "Hindi",
                status: "Katayuan",
                date: "Petsa",
                time: "Oras",
                duration: "Tagal",
                actions: "Mga Aksyon",
            },

            navigation: {
                dashboard: "Dashboard",
                home: "Home",
                assessments: "Mga Assessment",
                assessmentManagement: "Pamamahala ng Assessment",
                createAssessment: "Gumawa ng Assessment",
                scheduleAssessment: "Mag-iskedyul ng Assessment",
                assessmentHistory: "Kasaysayan ng Assessment",
                evaluation: "Pagsusuri",
                resultsMonitoring: "Pagsubaybay ng Resulta",
                certificates: "Mga Sertipiko",
                certificateManagement: "Pamamahala ng Sertipiko",
                userManagement: "Pamamahala ng User",
                traineeManagement: "Pamamahala ng Trainee",
                assessorManagement: "Pamamahala ng Assessor",
                settings: "Mga Setting",
                account: "Aking Account",
                preferences: "Mga Kagustuhan",
                notifications: "Mga Abiso",
                logout: "Mag-log Out",
            },

            navbar: {
                notifications: "Mga Abiso",
                profile: "Profile",
                settings: "Mga Setting",
                logout: "Mag-log Out",
            },

            preferences: {
                title: "Mga Kagustuhan",
                description: "I-customize ang iyong mga kagustuhan sa account.",

                language: "Wika",
                languageDescription: "Piliin ang iyong gustong wika.",

                timeZone: "Time Zone",
                timeZoneDescription: "Piliin ang iyong kasalukuyang time zone.",

                dateFormat: "Format ng Petsa",
                dateFormatDescription: "Piliin ang format ng petsang gusto mo.",

                theme: "Tema / Hitsura",
                themeDescription: "Piliin ang iyong gustong tema.",

                light: "Maliwanag",
                dark: "Madilim",

                saved: "Matagumpay na na-save ang mga kagustuhan.",
                error:
                    "Na-apply ang mga kagustuhan nang lokal ngunit hindi na-save sa iyong account.",
            },

            admin: {
                dashboard: "Admin Dashboard",
                welcome: "Maligayang pagdating sa Admin Dashboard",

                users: "Mga User",
                trainees: "Mga Trainee",
                assessors: "Mga Assessor",

                assessments: "Mga Assessment",
                assessmentLibrary: "Assessment Library",
                scheduledAssessments: "Mga Naka-iskedyul na Assessment",

                certificates: "Mga Sertipiko",
                results: "Pagsubaybay ng Resulta",

                totalUsers: "Kabuuang User",
                totalAssessments: "Kabuuang Assessment",
                completedAssessments: "Nakumpletong Assessment",
                pendingAssessments: "Mga Nakabinbing Assessment",

                recentActivity: "Kamakailang Aktibidad",
                upcomingAssessments: "Mga Paparating na Assessment",
            },

            assessor: {
                dashboard: "Assessor Dashboard",
                welcome: "Maligayang pagdating sa Assessor Dashboard",

                assignedAssessments: "Mga Nakatalagang Assessment",
                assessmentPanel: "Assessment Panel",
                assessmentHistory: "Kasaysayan ng Assessment",
                evaluation: "Pagsusuri",
                finalizeEvaluation: "Tapusin ang Pagsusuri",

                totalAssessments: "Kabuuang Assessment",
                completed: "Nakumpleto",
                pending: "Nakabinbin",
                upcoming: "Paparating",

                trainees: "Mga Trainee",
                selectedTrainees: "Mga Napiling Trainee",
                traineeInformation: "Impormasyon ng Trainee",

                aiAnalysis: "AI Analysis",
                aiInsights: "AI Insights",
                cognitiveReadiness: "Kahandaang Kognitibo",
                consistency: "Consistency",
                riskFlag: "Risk Flag",
            },

            trainee: {
                dashboard: "Trainee Dashboard",
                welcome: "Maligayang pagdating sa iyong dashboard",

                assessments: "Mga Assessment",
                myAssessments: "Aking mga Assessment",
                assessmentSummary: "Buod ng Assessment",
                results: "Mga Resulta",
                certificates: "Mga Sertipiko",

                upcomingAssessments: "Mga Paparating na Assessment",
                completedAssessments: "Nakumpletong Assessment",
                pendingAssessments: "Mga Nakabinbing Assessment",

                startAssessment: "Simulan ang Assessment",
                continueAssessment: "Ipagpatuloy ang Assessment",
                viewResults: "Tingnan ang Resulta",
                viewCertificate: "Tingnan ang Sertipiko",

                performance: "Performance",
                score: "Puntos",
                overallResult: "Kabuuang Resulta",
                feedback: "Feedback",
            },

            assessment: {
                assessment: "Assessment",
                assessmentDetails: "Detalye ng Assessment",
                assessmentType: "Uri ng Assessment",
                qualification: "Qualification",
                course: "Kurso",
                instructions: "Mga Tagubilin",
                questions: "Mga Tanong",
                question: "Tanong",
                answer: "Sagot",
                correctAnswer: "Tamang Sagot",
                choices: "Mga Pagpipilian",

                multipleChoice: "Multiple Choice",
                trueFalse: "Tama o Mali",
                identification: "Identification",
                matchingType: "Matching Type",
                situational: "Situational",

                createAssessment: "Gumawa ng Assessment",
                chooseAssessment: "Pumili ng Assessment",
                scheduleAssessment: "Mag-iskedyul ng Assessment",

                assessmentDate: "Petsa ng Assessment",
                startTime: "Oras ng Pagsisimula",
                endTime: "Oras ng Pagtatapos",

                selectedCourse: "Napiling Kurso",
                selectedTrainees: "Mga Napiling Trainee",
                assignedAssessor: "Nakatalagang Assessor",

                reviewConfirm: "Suriin at Kumpirmahin",
            },

            schedule: {
                title: "Mag-iskedyul ng Assessment",
                description:
                    "Ayusin ang iskedyul, mga kalahok, at mga nakatalagang assessor.",

                setDateTime: "Itakda ang petsa at oras ng assessment.",

                selected: "Napili",
                selectDate: "Pumili ng petsa",
                selectTimeRange: "Pumili ng oras",

                invalidTime: "Hindi wastong oras",

                completeFields:
                    "Pakikumpleto nang tama ang petsa, oras ng pagsisimula, at oras ng pagtatapos.",

                assessmentDetailsSummary: "Buod ng Detalye ng Assessment",

                noAssessment: "Walang napiling assessment",
                noTrainees: "Walang napiling trainee",
                noAssessor: "Wala",

                autoCalculated: "Awtomatikong kinakalkula",

                chooseAssessment: "Pumili ng Assessment",
            },

            results: {
                title: "Pagsubaybay ng Resulta",
                searchPlaceholder: "Maghanap ayon sa pangalan o ID ng trainee...",
                dateRange: "Saklaw ng Petsa",

                totalResults: "Kabuuang Resulta",
                passed: "Pumasa",
                failed: "Bumagsak",
                pending: "Nakabinbin",

                competent: "Competent",
                notYetCompetent: "Hindi Pa Competent",
            },

            certificates: {
                title: "Pamamahala ng Sertipiko",
                certificate: "Sertipiko",
                certificateId: "Certificate ID",
                trainee: "Trainee",
                course: "Kurso",
                status: "Katayuan",
                dateIssued: "Petsa ng Pag-isyu",

                issued: "Na-isyu",
                revoked: "Binawi",
                pending: "Nakabinbin",

                viewCertificate: "Tingnan ang Sertipiko",
                verifyCertificate: "I-verify ang Sertipiko",
            },

            account: {
                settings: "Mga Setting ng Account",
                myAccount: "Aking Account",
                accountSecurity: "Account at Seguridad",
                personalInformation: "Personal na Impormasyon",
                activeSessions: "Mga Aktibong Session",
                twoFactorAuthentication: "Two-Factor Authentication",
                notifications: "Mga Abiso",
                systemPreferences: "Mga Kagustuhan ng System",
            },

            messages: {
                saved: "Matagumpay na na-save ang mga pagbabago.",
                updated: "Matagumpay na na-update.",
                deleted: "Matagumpay na natanggal.",
                noResults: "Walang nakitang resulta.",
                noAssessments: "Walang nakitang assessment.",
                noCertificates: "Walang nakitang sertipiko.",
            },
        },
    },

    es: {
        translation: {
            common: {
                save: "Guardar cambios",
                cancel: "Cancelar",
                back: "Atrás",
                next: "Siguiente",
                nextStep: "Siguiente paso",
                close: "Cerrar",
                search: "Buscar",
                filter: "Filtrar",
                view: "Ver",
                viewDetails: "Ver detalles",
                edit: "Editar",
                delete: "Eliminar",
                submit: "Enviar",
                confirm: "Confirmar",
                loading: "Cargando...",
                noData: "No hay datos disponibles",
                status: "Estado",
                date: "Fecha",
                time: "Hora",
                duration: "Duración",
                actions: "Acciones",
            },

            navigation: {
                dashboard: "Panel",
                home: "Inicio",
                assessments: "Evaluaciones",
                assessmentManagement: "Gestión de evaluaciones",
                createAssessment: "Crear evaluación",
                scheduleAssessment: "Programar evaluación",
                assessmentHistory: "Historial de evaluaciones",
                evaluation: "Evaluación",
                resultsMonitoring: "Monitoreo de resultados",
                certificates: "Certificados",
                certificateManagement: "Gestión de certificados",
                userManagement: "Gestión de usuarios",
                traineeManagement: "Gestión de aprendices",
                assessorManagement: "Gestión de evaluadores",
                settings: "Configuración",
                account: "Mi cuenta",
                preferences: "Preferencias",
                notifications: "Notificaciones",
                logout: "Cerrar sesión",
            },

            navbar: {
                notifications: "Notificaciones",
                profile: "Perfil",
                settings: "Configuración",
                logout: "Cerrar sesión",
            },

            preferences: {
                title: "Preferencias",
                description: "Personaliza las preferencias de tu cuenta.",
                language: "Idioma",
                languageDescription: "Elige tu idioma preferido.",
                timeZone: "Zona horaria",
                timeZoneDescription: "Selecciona tu zona horaria actual.",
                dateFormat: "Formato de fecha",
                dateFormatDescription: "Elige tu formato de fecha preferido.",
                theme: "Tema / Apariencia",
                themeDescription: "Selecciona tu tema preferido.",
                light: "Claro",
                dark: "Oscuro",
                saved: "Preferencias guardadas.",
                error: "Las preferencias no pudieron guardarse en tu cuenta.",
            },

            admin: {
                dashboard: "Panel de administración",
                welcome: "Bienvenido al panel de administración",
                users: "Usuarios",
                trainees: "Aprendices",
                assessors: "Evaluadores",
                assessments: "Evaluaciones",
                assessmentLibrary: "Biblioteca de evaluaciones",
                scheduledAssessments: "Evaluaciones programadas",
                certificates: "Certificados",
                results: "Monitoreo de resultados",
                totalUsers: "Total de usuarios",
                totalAssessments: "Total de evaluaciones",
                completedAssessments: "Evaluaciones completadas",
                pendingAssessments: "Evaluaciones pendientes",
                recentActivity: "Actividad reciente",
                upcomingAssessments: "Próximas evaluaciones",
            },

            trainee: {
                dashboard: "Panel del aprendiz",
                welcome: "Bienvenido a tu panel",
                assessments: "Evaluaciones",
                myAssessments: "Mis evaluaciones",
                assessmentSummary: "Resumen de evaluación",
                results: "Resultados",
                certificates: "Certificados",
                upcomingAssessments: "Próximas evaluaciones",
                completedAssessments: "Evaluaciones completadas",
                pendingAssessments: "Evaluaciones pendientes",
                startAssessment: "Iniciar evaluación",
                continueAssessment: "Continuar evaluación",
                viewResults: "Ver resultados",
                viewCertificate: "Ver certificado",
                performance: "Rendimiento",
                score: "Puntuación",
                overallResult: "Resultado general",
                feedback: "Comentarios",
            },

            assessor: {
                dashboard: "Panel del evaluador",
                welcome: "Bienvenido al panel del evaluador",
                assignedAssessments: "Evaluaciones asignadas",
                assessmentPanel: "Panel de evaluación",
                assessmentHistory: "Historial de evaluaciones",
                evaluation: "Evaluación",
                finalizeEvaluation: "Finalizar evaluación",
                totalAssessments: "Total de evaluaciones",
                completed: "Completado",
                pending: "Pendiente",
                upcoming: "Próximo",
                trainees: "Aprendices",
                selectedTrainees: "Aprendices seleccionados",
                traineeInformation: "Información del aprendiz",
                aiAnalysis: "Análisis de IA",
                aiInsights: "Información de IA",
                cognitiveReadiness: "Preparación cognitiva",
                consistency: "Consistencia",
                riskFlag: "Indicador de riesgo",
            },

            assessment: {
                assessment: "Evaluación",
                assessmentDetails: "Detalles de la evaluación",
                assessmentType: "Tipo de evaluación",
                qualification: "Cualificación",
                course: "Curso",
                instructions: "Instrucciones",
                questions: "Preguntas",
                question: "Pregunta",
                answer: "Respuesta",
                correctAnswer: "Respuesta correcta",
                choices: "Opciones",
                multipleChoice: "Opción múltiple",
                trueFalse: "Verdadero o falso",
                identification: "Identificación",
                matchingType: "Relacionar",
                situational: "Situacional",
                createAssessment: "Crear evaluación",
                chooseAssessment: "Elegir evaluación",
                scheduleAssessment: "Programar evaluación",
                assessmentDate: "Fecha de evaluación",
                startTime: "Hora de inicio",
                endTime: "Hora de finalización",
                selectedCourse: "Curso seleccionado",
                selectedTrainees: "Aprendices seleccionados",
                assignedAssessor: "Evaluador asignado",
                reviewConfirm: "Revisar y confirmar",
            },

            schedule: {
                title: "Programar evaluación",
                description:
                    "Organiza horarios, participantes y asignaciones de evaluadores.",
                setDateTime: "Establece la fecha y hora de la evaluación.",
                selected: "Seleccionado",
                selectDate: "Selecciona una fecha",
                selectTimeRange: "Selecciona un horario",
                invalidTime: "Intervalo de tiempo no válido",
                completeFields:
                    "Completa correctamente la fecha, la hora de inicio y la hora de finalización.",
                assessmentDetailsSummary: "Resumen de detalles de la evaluación",
                noAssessment: "No se ha seleccionado ninguna evaluación",
                noTrainees: "No se han seleccionado aprendices",
                noAssessor: "Ninguno",
                autoCalculated: "Calculado automáticamente",
                chooseAssessment: "Elegir evaluación",
            },

            results: {
                title: "Monitoreo de resultados",
                searchPlaceholder:
                    "Buscar por nombre o ID del aprendiz...",
                dateRange: "Rango de fechas",
                totalResults: "Resultados totales",
                passed: "Aprobado",
                failed: "No aprobado",
                pending: "Pendiente",
                competent: "Competente",
                notYetCompetent: "Aún no competente",
            },

            certificates: {
                title: "Gestión de certificados",
                certificate: "Certificado",
                certificateId: "ID del certificado",
                trainee: "Aprendiz",
                course: "Curso",
                status: "Estado",
                dateIssued: "Fecha de emisión",
                issued: "Emitido",
                revoked: "Revocado",
                pending: "Pendiente",
                viewCertificate: "Ver certificado",
                verifyCertificate: "Verificar certificado",
            },

            account: {
                settings: "Configuración de cuenta",
                myAccount: "Mi cuenta",
                accountSecurity: "Cuenta y seguridad",
                personalInformation: "Información personal",
                activeSessions: "Sesiones activas",
                twoFactorAuthentication: "Autenticación de dos factores",
                notifications: "Notificaciones",
                systemPreferences: "Preferencias del sistema",
            },

            messages: {
                saved: "Cambios guardados correctamente.",
                updated: "Actualizado correctamente.",
                deleted: "Eliminado correctamente.",
                noResults: "No se encontraron resultados.",
                noAssessments: "No se encontraron evaluaciones.",
                noCertificates: "No se encontraron certificados.",
            },
        },
    },

    ja: {
        translation: {
            common: {
                save: "変更を保存",
                cancel: "キャンセル",
                back: "戻る",
                next: "次へ",
                nextStep: "次のステップ",
                close: "閉じる",
                search: "検索",
                filter: "フィルター",
                view: "表示",
                viewDetails: "詳細を表示",
                edit: "編集",
                delete: "削除",
                submit: "送信",
                confirm: "確認",
                loading: "読み込み中...",
                noData: "データがありません",
                status: "ステータス",
                date: "日付",
                time: "時間",
                duration: "期間",
                actions: "操作",
            },

            navigation: {
                dashboard: "ダッシュボード",
                home: "ホーム",
                assessments: "評価",
                assessmentManagement: "評価管理",
                createAssessment: "評価を作成",
                scheduleAssessment: "評価をスケジュール",
                assessmentHistory: "評価履歴",
                evaluation: "評価",
                resultsMonitoring: "結果モニタリング",
                certificates: "証明書",
                certificateManagement: "証明書管理",
                userManagement: "ユーザー管理",
                traineeManagement: "研修生管理",
                assessorManagement: "評価者管理",
                settings: "設定",
                account: "マイアカウント",
                preferences: "環境設定",
                notifications: "通知",
                logout: "ログアウト",
            },

            navbar: {
                notifications: "通知",
                profile: "プロフィール",
                settings: "設定",
                logout: "ログアウト",
            },

            preferences: {
                title: "環境設定",
                description: "アカウントの設定をカスタマイズします。",
                language: "言語",
                languageDescription: "使用する言語を選択してください。",
                timeZone: "タイムゾーン",
                timeZoneDescription: "現在のタイムゾーンを選択してください。",
                dateFormat: "日付形式",
                dateFormatDescription: "使用する日付形式を選択してください。",
                theme: "テーマ / 外観",
                themeDescription: "使用するテーマを選択してください。",
                light: "ライト",
                dark: "ダーク",
                saved: "設定を保存しました。",
                error: "設定をアカウントに保存できませんでした。",
            },

            admin: {
                dashboard: "管理者ダッシュボード",
                welcome: "管理者ダッシュボードへようこそ",
                users: "ユーザー",
                trainees: "研修生",
                assessors: "評価者",
                assessments: "評価",
                assessmentLibrary: "評価ライブラリ",
                scheduledAssessments: "スケジュール済み評価",
                certificates: "証明書",
                results: "結果モニタリング",
                totalUsers: "ユーザー総数",
                totalAssessments: "評価総数",
                completedAssessments: "完了した評価",
                pendingAssessments: "保留中の評価",
                recentActivity: "最近のアクティビティ",
                upcomingAssessments: "今後の評価",
            },

            trainee: {
                dashboard: "研修生ダッシュボード",
                welcome: "ダッシュボードへようこそ",
                assessments: "評価",
                myAssessments: "自分の評価",
                assessmentSummary: "評価概要",
                results: "結果",
                certificates: "証明書",
                upcomingAssessments: "今後の評価",
                completedAssessments: "完了した評価",
                pendingAssessments: "保留中の評価",
                startAssessment: "評価を開始",
                continueAssessment: "評価を続ける",
                viewResults: "結果を表示",
                viewCertificate: "証明書を表示",
                performance: "パフォーマンス",
                score: "スコア",
                overallResult: "総合結果",
                feedback: "フィードバック",
            },

            assessor: {
                dashboard: "評価者ダッシュボード",
                welcome: "評価者ダッシュボードへようこそ",
                assignedAssessments: "割り当てられた評価",
                assessmentPanel: "評価パネル",
                assessmentHistory: "評価履歴",
                evaluation: "評価",
                finalizeEvaluation: "評価を確定",
                totalAssessments: "評価総数",
                completed: "完了",
                pending: "保留中",
                upcoming: "今後",
                trainees: "研修生",
                selectedTrainees: "選択された研修生",
                traineeInformation: "研修生情報",
                aiAnalysis: "AI分析",
                aiInsights: "AIインサイト",
                cognitiveReadiness: "認知的準備度",
                consistency: "一貫性",
                riskFlag: "リスクフラグ",
            },

            assessment: {
                assessment: "評価",
                assessmentDetails: "評価詳細",
                assessmentType: "評価タイプ",
                qualification: "資格",
                course: "コース",
                instructions: "説明",
                questions: "質問",
                question: "質問",
                answer: "回答",
                correctAnswer: "正解",
                choices: "選択肢",
                multipleChoice: "多肢選択",
                trueFalse: "正誤",
                identification: "識別",
                matchingType: "マッチング",
                situational: "状況判断",
                createAssessment: "評価を作成",
                chooseAssessment: "評価を選択",
                scheduleAssessment: "評価をスケジュール",
                assessmentDate: "評価日",
                startTime: "開始時刻",
                endTime: "終了時刻",
                selectedCourse: "選択したコース",
                selectedTrainees: "選択した研修生",
                assignedAssessor: "担当評価者",
                reviewConfirm: "確認・確定",
            },

            schedule: {
                title: "評価をスケジュール",
                description: "評価スケジュール、参加者、評価者を管理します。",
                setDateTime: "評価の日付と時間を設定してください。",
                selected: "選択済み",
                selectDate: "日付を選択",
                selectTimeRange: "時間帯を選択",
                invalidTime: "無効な時間範囲",
                completeFields: "日付、開始時刻、終了時刻を正しく入力してください。",
                assessmentDetailsSummary: "評価詳細の概要",
                noAssessment: "評価が選択されていません",
                noTrainees: "研修生が選択されていません",
                noAssessor: "なし",
                autoCalculated: "自動計算",
                chooseAssessment: "評価を選択",
            },

            results: {
                title: "結果モニタリング",
                searchPlaceholder: "研修生の名前またはIDで検索...",
                dateRange: "日付範囲",
                totalResults: "結果総数",
                passed: "合格",
                failed: "不合格",
                pending: "保留中",
                competent: "能力あり",
                notYetCompetent: "未達成",
            },

            certificates: {
                title: "証明書管理",
                certificate: "証明書",
                certificateId: "証明書ID",
                trainee: "研修生",
                course: "コース",
                status: "ステータス",
                dateIssued: "発行日",
                issued: "発行済み",
                revoked: "取り消し済み",
                pending: "保留中",
                viewCertificate: "証明書を表示",
                verifyCertificate: "証明書を確認",
            },

            account: {
                settings: "アカウント設定",
                myAccount: "マイアカウント",
                accountSecurity: "アカウントとセキュリティ",
                personalInformation: "個人情報",
                activeSessions: "アクティブセッション",
                twoFactorAuthentication: "二要素認証",
                notifications: "通知",
                systemPreferences: "システム環境設定",
            },

            messages: {
                saved: "変更を正常に保存しました。",
                updated: "正常に更新しました。",
                deleted: "正常に削除しました。",
                noResults: "結果が見つかりません。",
                noAssessments: "評価が見つかりません。",
                noCertificates: "証明書が見つかりません。",
            },
        },
    },
};

i18n
    .use(initReactI18next)
    .init({
        resources,

        lng: "en",

        fallbackLng: "en",

        interpolation: {
            escapeValue: false,
        },

        react: {
            useSuspense: false,
        },
    });

export default i18n;