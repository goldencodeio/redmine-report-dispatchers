var REPORT = [
  {
    code: 'work_time',
    name: 'Рабочее\nвремя',
    manual: false
  },
  {
    code: 'written_time',
    name: '% Списанного\nвремени',
    manual: false
  },
  {
    code: 'total_tasks',
    name: 'Задач\nзаведено',
    manual: false
  },
  {
    code: 'total_tasks_paid_separately',
    name: 'Оплачивается\nотдельно',
    manual: false
  },
  {
    code: 'total_tasks_rate',
    name: 'Оценено\n(отзвонено)',
    manual: false
  },
  {
    code: 'done_tasks',
    name: 'Выполнено/\nОценено',
    manual: false
  },
 {
   code: 'overdue_tasks',
   name: 'Просроченных/\nОценено',
   manual: false
 },
  {
    code: 'unsubscribed',
    name: 'Неотписано/\nОценено',
    manual: false
  },
 {
   code: 'claims',
   name: 'Претензий/\nОтработано',
   manual: false
 },
 {
   code: 'forgotten',
   name: 'Забыто',
   manual: true
 },
 {
   code: 'contacts_saved',
   name: 'Сохранено\nконтактов ЦА',
   manual: true
 },
  {
    code: 'delays',
    name: 'Опозданий\n(мин)',
    manual: true
  },
  {
    code: 'overtime_spent',
    name: 'Переработок\n(мин)',
    manual: true
  },
  {
    code: 'lies',
    name: 'Вранья',
    manual: true
  },
  {
    code: 'points_written_off',
    name: 'Баллов\nсписано по\nпретензиям',
    manual: true
  }
];

function processReports() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  var rowI = 2;
  var columnI = 2;
  var doneIssues = [];
  var totalReports = [];
  OPTIONS.performers = OPTIONS.performers.map(function(user, userIndex) {
    user.reports = {};

    REPORT.forEach(function(report, reportIndex) {
      if (!report.manual) {
        var reportValue = getUserReport(report.code, user, userIndex);
        user.reports[report] = reportValue;
        if ((Array.isArray(reportValue))) {
          if (totalReports[reportIndex] === undefined) totalReports[reportIndex] = [];
          var listUrl = '';
          if ((Array.isArray(reportValue[0]))) {
            if (totalReports[reportIndex][0] === undefined) totalReports[reportIndex][0] = [];
            if (totalReports[reportIndex][1] === undefined) totalReports[reportIndex][1] = [];
            totalReports[reportIndex][0] = totalReports[reportIndex][0].concat(reportValue[0]);
            totalReports[reportIndex][1] = totalReports[reportIndex][1].concat(reportValue[1]);
            reportValue[0].forEach(function(task) {
              listUrl += 'http://redmine.zolotoykod.ru/issues/' + task.id + '\n';
            });
            sheet.getRange(rowI, columnI++).setValue(reportValue[0].length + ' / '+ reportValue[1].length).setNote(listUrl);
          } else {
            totalReports[reportIndex] = totalReports[reportIndex].concat(reportValue);
            reportValue.forEach(function(task) {
              listUrl += 'http://redmine.zolotoykod.ru/issues/' + task.id + '\n';
            });
            sheet.getRange(rowI, columnI++).setValue(reportValue.length).setNote(listUrl);
          }
        } else {
          if (totalReports[reportIndex] === undefined) totalReports[reportIndex] = 0;
          totalReports[reportIndex] += reportValue;
          sheet.getRange(rowI, columnI++).setValue(reportValue);
        }
      } else {
        ss.setNamedRange('manualRange' + rowI + columnI, sheet.getRange(sheet.getRange(rowI, columnI++).getA1Notation()));
      }
    });

    columnI = 2;
    rowI++;
    return user;
  });

  rowI += 2;

  totalReports.forEach(function(value, i) {
    if (i === 0) return ++columnI;

    if ((Array.isArray(value))) {
      var listUrl = '';
      if ((Array.isArray(value[0]))) {
        value[0].forEach(function(task) {
          listUrl += 'http://redmine.zolotoykod.ru/issues/' + task.id + '\n';
        });
        sheet.getRange(rowI, columnI++).setValue(value[0].length + ' / '+ value[1].length).setNote(listUrl);
      } else {
        value.forEach(function(task) {
          listUrl += 'http://redmine.zolotoykod.ru/issues/' + task.id + '\n';
        });
        sheet.getRange(rowI, columnI++).setValue(value.length).setNote(listUrl);
      }
    } else {
      sheet.getRange(rowI, columnI++).setValue(Math.floor(value / OPTIONS.performers.length));
    }
  });
}

function getUserReport(report, user, userIndex) {
  switch (report) {
    case 'work_time':
      return getWorkTime(userIndex);
      break;

    case 'written_time':
      return getWrittenTime(user, userIndex);
      break;

    case 'total_tasks':
      return getTotalTasks(user);
      break;

    case 'total_tasks_paid_separately':
      return getTotalTasksPaidSeparately(user);
      break;

    case 'total_tasks_rate':
      return getTotalTasksRate(user);
      break;

    case 'done_tasks':
      return getDoneTasks(user);
      break;

    case 'overdue_tasks':
      return getOverdueTasks(user);
      break;

    case 'unsubscribed':
      return getUnsubscribed(user);
      break;

    case 'claims':
      return getClaims(user);
      break;
  }
}

function getWorkTime(i) {
  return OPTIONS.performersWorkHours[i];
}

function getWrittenTime(user, i) {
  var res = APIRequest('time_entries', {query: [
    {key: 'user_id', value: user.id},
    {key: 'spent_on', value: formatDate(OPTIONS.currentDate)}
  ]});

  var timeEntries = res.time_entries.reduce(function(a, c) {
    return a + c.hours;
  }, 0);

  if (!OPTIONS.performersWorkHours[i]) return 0;
  return Math.floor(100 / parseInt(OPTIONS.performersWorkHours[i], 10) * timeEntries);
}

function getTotalTasks(user) {
  var res = APIRequest('issues', {query: [
    {key: 'tracker_id', value: '!5'},
    {key: 'assigned_to_id', value: user.id},
    {key: 'status_id', value: '*'},
    {key: 'created_on', value: formatDate(OPTIONS.currentDate)}
  ]});
  return res.issues;
}

function getTotalTasksPaidSeparately(user) {
  var res = APIRequest('issues', {query: [
    {key: 'tracker_id', value: '!5'},
    {key: 'assigned_to_id', value: user.id},
    {key: 'status_id', value: '*'},
    {key: 'created_on', value: formatDate(OPTIONS.currentDate)},
    {key: 'cf_24', value: 'Единовременная услуга (К оплате)'}
  ]});

  return res.issues;
}

function getTotalTasksRate(user) {
  var res = APIRequest('issues', {query: [
    {key: 'tracker_id', value: '!5'},
    {key: 'assigned_to_id', value: user.id},
    {key: 'status_id', value: '*'},
    {key: 'created_on', value: formatDate(OPTIONS.currentDate)},
    {key: 'cf_7', value: '*'}
  ]});

  return res.issues;
}

function getDoneTasks(user) {
  var res = APIRequest('issues', {query: [
    {key: 'tracker_id', value: '!5'},
    {key: 'assigned_to_id', value: user.id},
    {key: 'status_id', value: '*'},
    {key: 'created_on', value: '<=' + formatDate(OPTIONS.currentDate)},
    {key: 'updated_on', value: '>=' + formatDate(OPTIONS.currentDate)}
  ]});

  var filteredIssues = res.issues.filter(function(task) {
    var resDetail = APIRequestById('issues', task.id, {query: [
      {key: 'include', value: 'journals'}
    ]});

    for (var j = 0; j < resDetail.issue.journals.length; j++) {
      var journal = resDetail.issue.journals[j];
      var journalCreateDate = journal.created_on.split('T').shift();
      if (journalCreateDate === formatDate(OPTIONS.currentDate)) {
        for (var d = 0; d < journal.details.length; d++) {
          var detail = journal.details[d];
          if (detail.name === 'status_id' && detail.new_value === '3') return true;
        }
      }
    }
  });

  doneIssues = filteredIssues;

  var filteredIssuesWithRate = filteredIssues.filter(function(item) {
    if (item.custom_fields.find(function(i) {return i.id === 7}).value !== '')
      return true;
  });
  return [filteredIssues, filteredIssuesWithRate];
}

function getOverdueTasks(user) {
  var overdueTasks = doneIssues.filter(function(item) {
    if (item.due_date && (Date.parse(item.due_date) + 1000 * 60 * 60 * 24) < OPTIONS.currentDate.getTime())
      return true;
  });

  var overdueTasksWithRate = overdueTasks.filter(function(item) {
    if (item.custom_fields.find(function(i) {return i.id === 7}).value !== '')
      return true;
  });

  return [overdueTasks, overdueTasksWithRate];
}

function getUnsubscribed(user) {
  var unsubscribed = doneIssues.filter(function(item) {
    if (item.custom_fields.find(function(i) {return i.id === 1}).value === '')
      return true;
  });

  var unsubscribedWithRate = unsubscribed.filter(function(item) {
    if (item.custom_fields.find(function(i) {return i.id === 7}).value !== '')
      return true;
  });

  return [unsubscribed, unsubscribedWithRate];
}

function getClaims(user) {
  var res = APIRequest('issues', {query: [
    {key: 'tracker_id', value: 5},
    {key: 'status_id', value: '*'},
    {key: 'created_on', value: formatDate(OPTIONS.currentDate)}
  ]});

  var allClaims = res.issues.filter(function(item) {
    var responsibles = item.custom_fields.find(function(i) {return i.id === 40}).value;
    for (var i = 0; i < responsibles.length; i++) {
      if (parseInt(responsibles[i], 10) === user.id) return true;
    }
  });

  var closedClaims = allClaims.filter(function(item) {
    return item.status.id === 5;
  });

  return [allClaims, closedClaims];
}
