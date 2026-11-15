export type AdminRole = 'SUPER_ADMIN' | 'OPERATOR_DESA' | 'KEPALA_DESA';

export type PelayananStatus = 'Diajukan' | 'Diverifikasi' | 'Diproses' | 'Selesai' | 'Ditolak';

export type PesanStatus = 'Baru' | 'Dibaca' | 'Ditindaklanjuti' | 'Selesai';

export interface UserAccount {
  id: number;
  username: string;
  nama_lengkap: string;
  email: string;
  role: AdminRole;
  is_active: number;
  last_login: string | null;
  created_at: string;
}

export interface ProfilDesa {
  id: number;
  nama_desa: string;
  dusun_kantor: string;
  rt_kantor: string;
  rw_kantor: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  kode_pos: string;
  sejarah: string;
  visi: string;
  misi: string;
  letak_geografis: string;
  batas_utara: string;
  batas_selatan: string;
  batas_timur: string;
  batas_barat: string;
  kondisi_wilayah: string;
  luas_wilayah: string;
  jumlah_dusun: number;
  jumlah_rw: number;
  jumlah_rt: number;
  is_demo_data: number;
  updated_at: string;
}

export interface PengaturanDesa {
  id: number;
  nama_website: string;
  tagline: string;
  telepon: string;
  whatsapp: string;
  email: string;
  jam_pelayanan: string;
  alamat_lengkap: string;
  facebook_url: string;
  instagram_url: string;
  youtube_url: string;
  latitude: string;
  longitude: string;
  map_zoom: number;
  tampilkan_label_contoh: number;
  updated_at: string;
}

export interface PerangkatDesa {
  id: number;
  nama: string;
  jabatan: string;
  tingkatan: string;
  urutan: number;
  nip_nrpd: string;
  pendidikan: string;
  masa_jabatan: string;
  foto_url: string;
  keterangan: string;
  is_demo_data: number;
  created_at: string;
}

export interface Penduduk {
  id: number;
  nik: string;
  no_kk: string;
  nama_lengkap: string;
  jenis_kelamin: 'Laki-laki' | 'Perempuan';
  tempat_lahir: string;
  tanggal_lahir: string;
  agama: string;
  status_perkawinan: string;
  pendidikan: string;
  pekerjaan: string;
  alamat: string;
  rt: string;
  rw: string;
  dusun: string;
  no_hp: string;
  status_penduduk: 'Aktif' | 'Pindah' | 'Meninggal' | 'Sementara';
  is_demo_data: number;
  created_at: string;
}

export interface Keluarga {
  id: number;
  no_kk: string;
  kepala_keluarga: string;
  alamat: string;
  rt: string;
  rw: string;
  dusun: string;
  jumlah_anggota: number;
  status: 'Aktif' | 'Pindah' | 'Nonaktif';
  is_demo_data: number;
  created_at: string;
}

export interface KategoriBerita {
  id: number;
  nama: string;
  slug: string;
}

export interface Berita {
  id: number;
  judul: string;
  slug: string;
  kategori_id: number;
  kategori_nama?: string;
  ringkasan: string;
  isi: string;
  gambar_url: string;
  penulis: string;
  tanggal_publikasi: string;
  status: 'Dipublikasikan' | 'Draft';
  views: number;
  is_demo_data: number;
  created_at: string;
}

export interface Pengumuman {
  id: number;
  judul: string;
  kategori: 'Pengumuman' | 'Informasi Penting' | 'Jadwal Pelayanan' | 'Informasi Kegiatan' | 'Pemberitahuan Masyarakat';
  isi: string;
  tanggal: string;
  status: 'Aktif' | 'Arsip';
  prioritas: 'Penting' | 'Normal';
  lampiran_url: string;
  is_demo_data: number;
  created_at: string;
}

export interface JenisPelayanan {
  id: number;
  nama: string;
  kode: string;
  persyaratan: string;
  estimasi_waktu: string;
  is_active: number;
}

export interface Pelayanan {
  id: number;
  nomor_pengajuan: string;
  nama_pemohon: string;
  nik: string;
  no_kk: string;
  tempat_tanggal_lahir: string;
  alamat: string;
  no_hp: string;
  jenis_layanan_id: number;
  jenis_layanan_nama?: string;
  keperluan: string;
  dokumen_url: string;
  status: PelayananStatus;
  catatan_admin: string;
  created_at: string;
  updated_at: string;
}

export interface PotensiDesa {
  id: number;
  nama: string;
  kategori: 'Pertanian' | 'Peternakan' | 'Perikanan' | 'UMKM' | 'Kerajinan' | 'Perdagangan' | 'Wisata' | 'Produk unggulan';
  deskripsi: string;
  lokasi: string;
  kontak: string;
  foto_url: string;
  status: 'Aktif' | 'Nonaktif';
  is_demo_data: number;
  created_at: string;
}

export interface AgendaDesa {
  id: number;
  nama_kegiatan: string;
  tanggal: string;
  waktu: string;
  lokasi: string;
  deskripsi: string;
  penanggung_jawab: string;
  status: 'Akan Datang' | 'Berlangsung' | 'Selesai';
  is_demo_data: number;
  created_at: string;
}

export interface GaleriItem {
  id: number;
  judul: string;
  kategori:
    | 'Kegiatan Pemerintah Desa'
    | 'Gotong Royong'
    | 'Posyandu'
    | 'PKK'
    | 'Karang Taruna'
    | 'Keagamaan'
    | 'Pembangunan'
    | 'Kegiatan masyarakat';
  gambar_url: string;
  keterangan: string;
  tanggal: string;
  is_demo_data: number;
  created_at: string;
}

export interface PesanWarga {
  id: number;
  nama: string;
  no_hp: string;
  email: string;
  subjek: string;
  pesan: string;
  status: PesanStatus;
  catatan_tindak_lanjut: string;
  created_at: string;
}

export interface ActivityLog {
  id: number;
  user_id: number | null;
  username: string;
  role: string;
  aksi: string;
  modul: string;
  detail: string;
  ip_address: string;
  created_at: string;
}

export interface StatistikSummary {
  jumlahPenduduk: number;
  jumlahKK: number;
  lakiLaki: number;
  perempuan: number;
  jumlahRT: number;
  jumlahRW: number;
  jumlahDusun: number;
  jumlahUMKM: number;
  pendidikan: Record<string, number>;
  pekerjaan: Record<string, number>;
  isDemoData: boolean;
}
