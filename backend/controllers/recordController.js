// ... existing code ...
// 创建新记录
exports.createRecord = async (req, res) => {
  try {
    const {
      waste_type,
      location,
      quantity,
      collection_start_time,
      collection_end_time,
      record_time,
      creator_name,
      creator_id,
      remarks
    } = req.body;

    // 处理上传的照片
    let photo_path_before = null;
    let photo_path_after = null;

    if (req.files) {
      if (req.files.photo_before) {
        const photoBeforeFile = req.files.photo_before;
        const photoBeforeFileName = `${Date.now()}-before-${photoBeforeFile.name}`;
        const photoBeforePath = path.join('uploads', photoBeforeFileName);
        
        await photoBeforeFile.mv(photoBeforePath);
        photo_path_before = photoBeforePath;
      }

      if (req.files.photo_after) {
        const photoAfterFile = req.files.photo_after;
        const photoAfterFileName = `${Date.now()}-after-${photoAfterFile.name}`;
        const photoAfterPath = path.join('uploads', photoAfterFileName);
        
        await photoAfterFile.mv(photoAfterPath);
        photo_path_after = photoAfterPath;
      }
    }

    // 创建记录
    const record = await Record.create({
      waste_type,
      location,
      quantity,
      collection_start_time,
      collection_end_time,
      record_time,
      creator_name,
      creator_id,
      photo_path_before,
      photo_path_after,
      remarks
    });

    res.status(201).json(record);
  } catch (error) {
    console.error('创建记录失败:', error);
    res.status(500).json({ message: '创建记录失败', error: error.message });
  }
};

// 更新记录
exports.updateRecord = async (req, res) => {
  try {
    const recordId = req.params.id;
    const {
      waste_type,
      location,
      quantity,
      collection_start_time,
      collection_end_time,
      record_time,
      creator_name,
      creator_id,
      remarks,
      photo_path_before,
      photo_path_after
    } = req.body;

    // 获取现有记录
    const record = await Record.findByPk(recordId);
    if (!record) {
      return res.status(404).json({ message: '记录不存在' });
    }

    // 处理上传的照片
    let newPhotoPathBefore = photo_path_before;
    let newPhotoPathAfter = photo_path_after;

    if (req.files) {
      // 处理清理前照片
      if (req.files.photo_before) {
        const photoBeforeFile = req.files.photo_before;
        const photoBeforeFileName = `${Date.now()}-before-${photoBeforeFile.name}`;
        const photoBeforePath = path.join('uploads', photoBeforeFileName);
        
        await photoBeforeFile.mv(photoBeforePath);
        
        // 如果有旧照片，删除它
        if (record.photo_path_before && fs.existsSync(record.photo_path_before)) {
          fs.unlinkSync(record.photo_path_before);
        }
        
        newPhotoPathBefore = photoBeforePath;
      }

      // 处理清理后照片
      if (req.files.photo_after) {
        const photoAfterFile = req.files.photo_after;
        const photoAfterFileName = `${Date.now()}-after-${photoAfterFile.name}`;
        const photoAfterPath = path.join('uploads', photoAfterFileName);
        
        await photoAfterFile.mv(photoAfterPath);
        
        // 如果有旧照片，删除它
        if (record.photo_path_after && fs.existsSync(record.photo_path_after)) {
          fs.unlinkSync(record.photo_path_after);
        }
        
        newPhotoPathAfter = photoAfterPath;
      }
    }

    // 更新记录
    await record.update({
      waste_type,
      location,
      quantity,
      collection_start_time,
      collection_end_time,
      record_time,
      creator_name,
      creator_id,
      photo_path_before: newPhotoPathBefore,
      photo_path_after: newPhotoPathAfter,
      remarks
    });

    res.status(200).json(record);
  } catch (error) {
    console.error('更新记录失败:', error);
    res.status(500).json({ message: '更新记录失败', error: error.message });
  }
};
// ... existing code ... 