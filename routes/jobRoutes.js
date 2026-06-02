'use strict';
const router = require('express').Router();
const auth   = require('../middleware/auth');
const c      = require('../controllers/jobController');

// IMPORTANT: specific routes BEFORE /:id
router.get ('/generate-req-id',    auth(['school']),  c.previewReqId);
router.get ('/my-jobs',            auth(['school']),  c.myJobs);
router.get ('/my-applications',    auth(['teacher']), c.myApplications);
router.get ('/job-applicants/:jobId', auth(['school']), c.jobApplicants);
router.get ('/',                   c.listJobs);
router.get ('/:id',                c.getJob);
router.post('/',                   auth(['school']),  c.createJob);
router.post('/applications',       auth(['teacher']), c.applyJob);
router.patch('/applications/:id',  auth(['school']),  c.updateApplication);

module.exports = router;
